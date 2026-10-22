const express = require("express");
const jwt = require("jsonwebtoken");
const webPush = require("web-push");
const fs = require("fs");
const path = require("path");
const { ObjectId } = require("mongodb");
const { deleteStoredImages } = require("./s3-books");
const { cert, getApps, initializeApp } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");

// FCM's maximum retention period is four weeks. The server-side inbox below
// remains available for 30 days so devices can still catch up after that.
const MOBILE_PUSH_TTL_SECONDS = 28 * 24 * 60 * 60;
const MOBILE_PUSH_TTL_MS = MOBILE_PUSH_TTL_SECONDS * 1000;
const WEB_PUSH_TTL_SECONDS = 30 * 24 * 60 * 60;

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
    user.permissions?.includes("notifications.manage") ||
    user.permissions?.includes("settings.manage") ||
    user.permissions?.includes("content.publish"));
const publicNotice = (item, deviceId = "", delivery = null) => ({
  id: item._id.toString(),
  title: item.title,
  body: item.body,
  fullBody: item.fullBody || item.body,
  category: item.category || "general",
  data: item.data || {},
  imageUrl: item.imageUrl || "",
  createdAt: item.createdAt,
  unread: delivery ? !delivery.readAt : deviceId ? !Array.isArray(item.readBy) || !item.readBy.includes(deviceId) : false,
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

const webPushConfigured = () =>
  Boolean(process.env.WEB_PUSH_PUBLIC_KEY && process.env.WEB_PUSH_PRIVATE_KEY);
const configureWebPush = () => {
  if (!webPushConfigured()) return false;
  webPush.setVapidDetails(
    process.env.WEB_PUSH_SUBJECT || "mailto:support@deenislam.app",
    process.env.WEB_PUSH_PUBLIC_KEY,
    process.env.WEB_PUSH_PRIVATE_KEY,
  );
  return true;
};
let firebaseMessaging;
const getFirebaseMessaging = () => {
  if (firebaseMessaging) return firebaseMessaging;
  const configuredPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!configuredPath) return null;
  const serviceAccountPath = path.resolve(process.cwd(), configuredPath);
  if (!fs.existsSync(serviceAccountPath)) return null;
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
  const app = getApps()[0] || initializeApp({ credential: cert(serviceAccount) });
  firebaseMessaging = getMessaging(app);
  return firebaseMessaging;
};

function createNotificationRouter(getTokens, getNotices, getDeliveries, jwtSecret) {
  const router = express.Router();
  router.get("/api/notifications/web-public-key", (_req, res) => {
    res.set("Cache-Control", "public, max-age=3600");
    res.json({ data: { publicKey: process.env.WEB_PUSH_PUBLIC_KEY || "" } });
  });
  router.post("/api/notifications/web-register", async (req, res) => {
    try {
      if (!webPushConfigured())
        return res.status(503).json({ message: "Web push is not configured." });
      const deviceId = clean(req.body.deviceId, 128), subscription = req.body.subscription;
      if (!deviceId || !subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth)
        return res.status(400).json({ message: "A valid browser push subscription is required." });
      const now = new Date(), user = actor(req, jwtSecret);
      await getTokens().updateOne(
        { deviceId },
        {
          $set: { deviceId, pushType: "web", webSubscription: subscription, platform: "web", permission: "granted", active: true, userId: user?.sub || null, updatedAt: now },
          $unset: { expoPushToken: "" },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true },
      );
      res.status(201).json({ data: { registered: true } });
    } catch (error) {
      console.error("Web push registration failed:", error);
      res.status(500).json({ message: "Unable to register browser notifications." });
    }
  });
  router.post("/api/notifications/register", async (req, res) => {
    try {
      const deviceId = clean(req.body.deviceId, 128),
        expoPushToken = clean(req.body.expoPushToken, 220),
        fcmToken = clean(req.body.fcmToken, 4096);
      if (
        !deviceId ||
        (!fcmToken && !/^ExponentPushToken\[[^\]]+\]$|^ExpoPushToken\[[^\]]+\]$/.test(expoPushToken))
      )
        return res.status(400).json({
          message: "A valid device and mobile push token are required.",
        });
      const user = actor(req, jwtSecret),
        now = new Date();
      await getTokens().updateOne(
        { deviceId },
        {
          $set: {
            deviceId,
            pushType: fcmToken ? "fcm" : "expo",
            expoPushToken,
            fcmToken,
            platform: clean(req.body.platform, 20),
            appVersion: clean(req.body.appVersion, 30),
            permission: "granted",
            active: true,
            userId: user?.sub || null,
            updatedAt: now,
          },
          $unset: { webSubscription: "" },
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
      const cutoff = new Date(Date.now() - 30 * 86400000), user = actor(req, jwtSecret);
      const items = await getNotices()
        .find({
          published: true,
          createdAt: { $gte: cutoff },
          expiresAt: { $gt: new Date() },
          deletedBy: { $ne: deviceId },
        })
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray();
      if (items.length) await getDeliveries().bulkWrite(items.map((item) => ({ updateOne: { filter: { noticeId: item._id, deviceId }, update: { $setOnInsert: { noticeId: item._id, deviceId, recipientKey: user?.sub ? `user:${user.sub}` : `guest:${deviceId}`, userId: user?.sub || null, readAt: null, deletedAt: null, createdAt: new Date(), updatedAt: new Date(), expiresAt: item.expiresAt || new Date(new Date(item.createdAt).getTime() + 30 * 86400000) } }, upsert: true } })), { ordered: false });
      const deliveries = await getDeliveries().find({ noticeId: { $in: items.map((item) => item._id) }, deviceId }).toArray(), deliveryMap = new Map(deliveries.map((item) => [item.noticeId.toString(), item]));
      const visible = items.filter((item) => !deliveryMap.get(item._id.toString())?.deletedAt);
      res.set("Cache-Control", "no-store");
      res.json({
        data: visible.map((item) => publicNotice(item, deviceId, deliveryMap.get(item._id.toString()))),
        unread: visible.filter((item) => !deliveryMap.get(item._id.toString())?.readAt).length,
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
      const noticeId = new ObjectId(req.params.id), notice = await getNotices().findOne({ _id: noticeId });
      if (!notice) return res.status(404).json({ message: "Notification not found." });
      await getDeliveries().updateOne({ noticeId, deviceId }, { $set: { readAt: new Date(), updatedAt: new Date() }, $setOnInsert: { noticeId, deviceId, recipientKey: `guest:${deviceId}`, deletedAt: null, createdAt: new Date(), expiresAt: notice.expiresAt || new Date(new Date(notice.createdAt).getTime() + 30 * 86400000) } }, { upsert: true });
      res.json({ data: { read: true } });
    } catch {
      res.status(500).json({ message: "Unable to update notification." });
    }
  });
  router.delete("/api/notifications/:id", async (req, res) => {
    try {
      const { ObjectId } = require("mongodb"), deviceId = clean(req.body.deviceId, 128);
      if (!ObjectId.isValid(req.params.id) || !deviceId)
        return res.status(400).json({ message: "Notification and device ID are required." });
      const noticeId = new ObjectId(req.params.id), notice = await getNotices().findOne({ _id: noticeId, published: true });
      if (!notice) return res.status(404).json({ message: "Notification not found." });
      await getDeliveries().updateOne({ noticeId, deviceId }, { $set: { deletedAt: new Date(), updatedAt: new Date() }, $setOnInsert: { noticeId, deviceId, recipientKey: `guest:${deviceId}`, readAt: null, createdAt: new Date(), expiresAt: notice.expiresAt || new Date(new Date(notice.createdAt).getTime() + 30 * 86400000) } }, { upsert: true });
      res.json({ message: "Notification removed from this device.", data: { deleted: true } });
    } catch {
      res.status(500).json({ message: "Unable to remove notification." });
    }
  });
  router.post("/api/notifications/read-all", async (req, res) => {
    try {
      const deviceId = clean(req.body.deviceId, 128);
      if (!deviceId)
        return res.status(400).json({ message: "Device ID is required." });
      await getDeliveries().updateMany({ deviceId, deletedAt: null }, { $set: { readAt: new Date(), updatedAt: new Date() } });
      res.json({ data: { read: true } });
    } catch {
      res.status(500).json({ message: "Unable to update notifications." });
    }
  });
  router.get("/api/notifications/:id", async (req, res) => {
    try {
      const deviceId = clean(req.query.deviceId, 240);
      if (!deviceId || !ObjectId.isValid(req.params.id))
        return res.status(400).json({ message: "A valid notification and device are required." });
      const noticeId = new ObjectId(req.params.id);
      const [notice, delivery] = await Promise.all([
        getNotices().findOne({ _id: noticeId, published: true, expiresAt: { $gt: new Date() } }),
        getDeliveries().findOne({ noticeId, deviceId, deletedAt: null }),
      ]);
      if (!notice || !delivery)
        return res.status(404).json({ message: "Notification not found." });
      res.json({ data: publicNotice(notice, deviceId, delivery) });
    } catch {
      res.status(500).json({ message: "Unable to load notification." });
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
        getNotices()
          .find({ expiresAt: { $gt: new Date() } })
          .sort({ createdAt: -1 })
          .limit(100)
          .toArray(),
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
  router.delete("/api/admin/notifications/:id", async (req, res) => {
    try {
      const { ObjectId } = require("mongodb");
      if (!ObjectId.isValid(req.params.id))
        return res.status(400).json({ message: "Invalid notification ID." });
      const id = new ObjectId(req.params.id);
      const notice = await getNotices().findOne({ _id: id });
      if (!notice)
        return res.status(404).json({ message: "Notification not found." });
      await deleteStoredImages(notice);
      await getNotices().deleteOne({ _id: id });
      await getDeliveries().deleteMany({ noticeId: id });
      res.json({ message: "Notification deleted successfully." });
    } catch (error) {
      console.error("Notification delete failed:", error);
      res.status(500).json({ message: "Unable to delete notification." });
    }
  });
  router.post("/api/admin/notifications", async (req, res) => {
    try {
      const title = clean(req.body.title, 100),
        body = clean(req.body.body, 500),
        fullBody = clean(req.body.fullBody, 30000) || body,
        category = clean(req.body.category, 40) || "general",
        screen = clean(req.body.screen, 50),
        contentId = clean(req.body.contentId, 1000),
        surahNumber = Math.max(0, Math.min(114, Number(req.body.surahNumber) || 0)),
        ayahNumber = Math.max(0, Number(req.body.ayahNumber) || 0),
        imageUrl = clean(req.body.imageUrl, 2000) || `${String(process.env.PUBLIC_APP_URL || "https://deenislam.app").replace(/\/$/, "")}/deen-islam-app-icon.png`,
        imageKey = clean(req.body.imageKey, 1000);
      const destinationUrl = contentId && (/^https?:\/\//i.test(contentId) || contentId.startsWith("/")) ? contentId : "";
      if (!title || !body)
        return res
          .status(400)
          .json({ message: "Title and message are required." });
      const notificationId = new ObjectId(),
        tokens = await getTokens().find({ active: true }).toArray(),
        fcmTokens = tokens.filter((item) => item.fcmToken),
        expoTokens = tokens.filter((item) => item.expoPushToken && !item.fcmToken),
        webTokens = tokens.filter((item) => item.webSubscription?.endpoint),
        messages = expoTokens.map((item) => ({
          to: item.expoPushToken,
          sound: "default",
          title,
          body,
          ttl: MOBILE_PUSH_TTL_SECONDS,
          channelId: "deenislam-updates",
          data: { type: "admin_notification", notificationId: notificationId.toString(), category, screen, imageUrl, contentId, surahNumber, ayahNumber },
          richContent: { image: imageUrl },
        }));
      let tickets = [], sendError = "", webResults = [], fcmResult = null;
      try {
        if (messages.length) tickets = await sendExpo(messages);
      } catch (error) {
        sendError = error.message || "Push delivery failed.";
      }
      const messaging = getFirebaseMessaging();
      if (fcmTokens.length && messaging) {
        try {
          fcmResult = await messaging.sendEachForMulticast({
            tokens: fcmTokens.map((item) => item.fcmToken),
            notification: { title, body, imageUrl },
            data: { type: "admin_notification", notificationId: notificationId.toString(), category, screen: screen || "notifications", imageUrl, contentId, surahNumber: String(surahNumber), ayahNumber: String(ayahNumber) },
            android: {
              priority: "high",
              ttl: MOBILE_PUSH_TTL_MS,
              notification: { channelId: "deenislam-updates", sound: "default", color: "#076B43", imageUrl },
            },
          });
        } catch (error) {
          sendError = [sendError, error.message || "Firebase delivery failed."].filter(Boolean).join(" ");
        }
      } else if (fcmTokens.length) sendError = [sendError, "Firebase Admin is not configured."].filter(Boolean).join(" ");
      if (webTokens.length && configureWebPush()) {
        webResults = await Promise.allSettled(
          webTokens.map((item) => webPush.sendNotification(
            item.webSubscription,
            JSON.stringify({ title, body, icon: imageUrl, image: imageUrl, badge: "/deen-islam-app-icon.png", tag: `deenislam-${Date.now()}`, data: { type: "admin_notification", notificationId: notificationId.toString(), category, screen, imageUrl, contentId, surahNumber, ayahNumber, url: destinationUrl || `/notification/${notificationId}` } }),
            { TTL: WEB_PUSH_TTL_SECONDS, urgency: "high" },
          )),
        );
      } else if (webTokens.length) sendError = [sendError, "Web push is not configured."].filter(Boolean).join(" ");
      const failedTokens = [];
      tickets.forEach((ticket, index) => {
        if (ticket.status === "error")
          failedTokens.push(expoTokens[index]?.expoPushToken);
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
      const invalidFcmDevices = fcmResult ? fcmResult.responses.flatMap((result, index) => !result.success && ["messaging/registration-token-not-registered", "messaging/invalid-registration-token"].includes(result.error?.code) ? [fcmTokens[index].deviceId] : []) : [];
      if (invalidFcmDevices.length) await getTokens().updateMany({ deviceId: { $in: invalidFcmDevices } }, { $set: { active: false, lastError: "Firebase rejected this device token", updatedAt: new Date() } });
      const expiredWebDevices = webResults.flatMap((result, index) => result.status === "rejected" && [404, 410].includes(result.reason?.statusCode) ? [webTokens[index].deviceId] : []);
      if (expiredWebDevices.length) await getTokens().updateMany({ deviceId: { $in: expiredWebDevices } }, { $set: { active: false, lastError: "Browser push subscription expired", updatedAt: new Date() } });
      const sentCount = tickets.filter((ticket) => ticket.status === "ok").length + (fcmResult?.successCount || 0) + webResults.filter((result) => result.status === "fulfilled").length,
        failedCount = Math.max(0, tokens.length - sentCount),
        notice = {
          _id: notificationId,
          title,
          body,
          fullBody,
          category,
          imageUrl,
          imageKey,
          data: { screen, imageUrl, contentId, surahNumber, ayahNumber },
          published: true,
          readBy: [],
          recipientCount: tokens.length,
          sentCount,
          failedCount,
          sendError,
          createdBy: req.notificationAdmin.email || "",
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 86400000),
        };
      const result = await getNotices().insertOne(notice);
      if (tokens.length) await getDeliveries().bulkWrite(tokens.map((item) => ({ updateOne: { filter: { noticeId: result.insertedId, deviceId: item.deviceId }, update: { $setOnInsert: { noticeId: result.insertedId, deviceId: item.deviceId, recipientKey: item.userId ? `user:${item.userId}` : `guest:${item.deviceId}`, userId: item.userId || null, readAt: null, deletedAt: null, createdAt: notice.createdAt, updatedAt: notice.createdAt, expiresAt: notice.expiresAt } }, upsert: true } })), { ordered: false });
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
