const express = require("express");
const jwt = require("jsonwebtoken");

const clean = (value, max = 500) =>
  String(value || "")
    .trim()
    .slice(0, max);
const actor = (req, secret) => {
  const raw = String(req.get("authorization") || "").replace(/^Bearer\s+/i, "");
  try {
    return jwt.verify(raw, secret);
  } catch {
    return null;
  }
};
const canManage = (user) =>
  user &&
  (user.adminRole === "super_admin" ||
    user.permissions?.includes("*") ||
    user.permissions?.includes("settings.manage") ||
    user.permissions?.includes("content.publish"));
const publicNotice = (item, deviceId = "") => ({
  id: item._id.toString(),
  title: item.title,
  body: item.body,
  category: item.category || "general",
  data: item.data || {},
  createdAt: item.createdAt,
  unread: deviceId
    ? !Array.isArray(item.readBy) || !item.readBy.includes(deviceId)
    : false,
});

async function sendExpo(messages) {
  const results = [];
  for (let start = 0; start < messages.length; start += 100) {
    const batch = messages.slice(start, start + 100);
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(batch),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok)
      throw Error(
        body?.errors?.[0]?.message || "Expo Push Service rejected the request.",
      );
    results.push(
      ...(Array.isArray(body.data) ? body.data : [body.data]).filter(Boolean),
    );
  }
  return results;
}

function createNotificationRouter(getTokens, getNotices, jwtSecret) {
  const router = express.Router();
  router.post("/api/notifications/register", async (req, res) => {
    try {
      const deviceId = clean(req.body.deviceId, 128),
        expoPushToken = clean(req.body.expoPushToken, 220);
      if (
        !deviceId ||
        !/^ExponentPushToken\[[^\]]+\]$|^ExpoPushToken\[[^\]]+\]$/.test(
          expoPushToken,
        )
      )
        return res.status(400).json({
          message: "A valid device and Expo push token are required.",
        });
      const user = actor(req, jwtSecret),
        now = new Date();
      await getTokens().updateOne(
        { deviceId },
        {
          $set: {
            deviceId,
            expoPushToken,
            platform: clean(req.body.platform, 20),
            appVersion: clean(req.body.appVersion, 30),
            permission: "granted",
            active: true,
            userId: user?.sub || null,
            updatedAt: now,
          },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true },
      );
      res.status(201).json({ data: { registered: true } });
    } catch (error) {
      console.error("Push registration failed:", error);
      res.status(500).json({ message: "Unable to register notifications." });
    }
  });
  router.post("/api/notifications/unregister", async (req, res) => {
    try {
      const deviceId = clean(req.body.deviceId, 128);
      if (deviceId)
        await getTokens().updateOne(
          { deviceId },
          {
            $set: {
              active: false,
              permission: "disabled",
              updatedAt: new Date(),
            },
          },
        );
      res.json({ data: { registered: false } });
    } catch {
      res.status(500).json({ message: "Unable to disable notifications." });
    }
  });
  router.get("/api/notifications", async (req, res) => {
    try {
      const deviceId = clean(req.query.deviceId, 128);
      if (!deviceId)
        return res.status(400).json({ message: "Device ID is required." });
      const items = await getNotices()
        .find({ published: true })
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray();
      res.set("Cache-Control", "no-store");
      res.json({
        data: items.map((item) => publicNotice(item, deviceId)),
        unread: items.filter(
          (item) =>
            !Array.isArray(item.readBy) || !item.readBy.includes(deviceId),
        ).length,
      });
    } catch {
      res.status(500).json({ message: "Unable to load notifications." });
    }
  });
  router.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const { ObjectId } = require("mongodb"),
        deviceId = clean(req.body.deviceId, 128);
      if (!ObjectId.isValid(req.params.id) || !deviceId)
        return res
          .status(400)
          .json({ message: "Notification and device ID are required." });
      await getNotices().updateOne(
        { _id: new ObjectId(req.params.id) },
        { $addToSet: { readBy: deviceId } },
      );
      res.json({ data: { read: true } });
    } catch {
      res.status(500).json({ message: "Unable to update notification." });
    }
  });
  router.post("/api/notifications/read-all", async (req, res) => {
    try {
      const deviceId = clean(req.body.deviceId, 128);
      if (!deviceId)
        return res.status(400).json({ message: "Device ID is required." });
      await getNotices().updateMany(
        { published: true },
        { $addToSet: { readBy: deviceId } },
      );
      res.json({ data: { read: true } });
    } catch {
      res.status(500).json({ message: "Unable to update notifications." });
    }
  });
  router.use("/api/admin/notifications", (req, res, next) => {
    const user = actor(req, jwtSecret);
    if (!canManage(user))
      return res
        .status(403)
        .json({ message: "Notification management permission is required." });
    req.notificationAdmin = user;
    next();
  });
  router.get("/api/admin/notifications", async (_req, res) => {
    try {
      const [items, activeDevices] = await Promise.all([
        getNotices().find({}).sort({ createdAt: -1 }).limit(100).toArray(),
        getTokens().countDocuments({ active: true }),
      ]);
      res.json({
        data: {
          activeDevices,
          items: items.map((item) => ({
            ...publicNotice(item),
            sentCount: item.sentCount || 0,
            failedCount: item.failedCount || 0,
            createdBy: item.createdBy || "",
          })),
        },
      });
    } catch {
      res.status(500).json({ message: "Unable to load notification history." });
    }
  });
  router.post("/api/admin/notifications", async (req, res) => {
    try {
      const title = clean(req.body.title, 100),
        body = clean(req.body.body, 500),
        category = clean(req.body.category, 40) || "general",
        screen = clean(req.body.screen, 50);
      if (!title || !body)
        return res
          .status(400)
          .json({ message: "Title and message are required." });
      const tokens = await getTokens()
          .find(
            { active: true },
            { projection: { expoPushToken: 1, deviceId: 1 } },
          )
          .toArray(),
        messages = tokens.map((item) => ({
          to: item.expoPushToken,
          sound: "default",
          title,
          body,
          channelId: "deenislam-updates",
          data: { type: "admin_notification", category, screen },
        }));
      let tickets = [],
        sendError = "";
      try {
        if (messages.length) tickets = await sendExpo(messages);
      } catch (error) {
        sendError = error.message || "Push delivery failed.";
      }
      const failedTokens = [];
      tickets.forEach((ticket, index) => {
        if (ticket.status === "error")
          failedTokens.push(tokens[index]?.expoPushToken);
      });
      if (failedTokens.length)
        await getTokens().updateMany(
          { expoPushToken: { $in: failedTokens } },
          {
            $set: {
              active: false,
              lastError: "Expo rejected this push token",
              updatedAt: new Date(),
            },
          },
        );
      const sentCount = tickets.filter(
          (ticket) => ticket.status === "ok",
        ).length,
        failedCount = Math.max(0, tokens.length - sentCount),
        notice = {
          title,
          body,
          category,
          data: { screen },
          published: true,
          readBy: [],
          recipientCount: tokens.length,
          sentCount,
          failedCount,
          sendError,
          createdBy: req.notificationAdmin.email || "",
          createdAt: new Date(),
        };
      const result = await getNotices().insertOne(notice);
      res.status(201).json({
        message: sendError
          ? "Notification saved, but push delivery failed: " + sendError
          : "Notification sent to " + sentCount + " device(s).",
        data: {
          ...publicNotice({ ...notice, _id: result.insertedId }),
          sentCount,
          failedCount,
        },
      });
    } catch (error) {
      console.error("Notification broadcast failed:", error);
      res.status(500).json({ message: "Unable to send notification." });
    }
  });
  return router;
}
module.exports = { createNotificationRouter };
