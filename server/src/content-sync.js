const express = require("express");

const listeners = new Set();

function sendEvent(response, revision, updatedAt) {
  response.write(
    `event: content-version\ndata: ${JSON.stringify({ revision, updatedAt })}\n\n`,
  );
}

function createContentSyncRouter(getSettings) {
  const router = express.Router();

  router.get("/api/content/version", async (_req, res) => {
    try {
      const row = await getSettings().findOne(
        { _id: "content_revision" },
        { projection: { _id: 0, revision: 1, updatedAt: 1, lastPath: 1 } },
      );
      res.set("Cache-Control", "no-store, no-cache, must-revalidate");
      res.json({
        data: {
          revision: Number(row?.revision) || 0,
          updatedAt: row?.updatedAt || null,
          lastPath: row?.lastPath || "",
        },
      });
    } catch (error) {
      console.error("Content version read failed:", error);
      res.status(500).json({ message: "Unable to read the content version." });
    }
  });

  router.get("/api/content/events", async (_req, res) => {
    res.set({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.flushHeaders?.();
    listeners.add(res);
    try {
      const row = await getSettings().findOne(
        { _id: "content_revision" },
        { projection: { revision: 1, updatedAt: 1 } },
      );
      sendEvent(res, Number(row?.revision) || 0, row?.updatedAt || null);
    } catch {
      sendEvent(res, 0, null);
    }
    const heartbeat = setInterval(() => res.write(": keep-alive\n\n"), 20000);
    _req.on("close", () => {
      clearInterval(heartbeat);
      listeners.delete(res);
    });
  });

  return router;
}

function createContentRevisionMiddleware(getSettings) {
  return (req, res, next) => {
    const isAdminMutation =
      req.path.startsWith("/api/admin/") &&
      !["GET", "HEAD", "OPTIONS"].includes(req.method);
    if (!isAdminMutation || req.path === "/api/admin/login") return next();
    res.on("finish", () => {
      if (res.statusCode < 200 || res.statusCode >= 300) return;
      const now = new Date();
      void getSettings()
        .findOneAndUpdate(
          { _id: "content_revision" },
          {
            $inc: { revision: 1 },
            $set: {
              updatedAt: now,
              lastPath: req.originalUrl,
              lastMethod: req.method,
            },
            $setOnInsert: { createdAt: now },
          },
          { upsert: true, returnDocument: "after" },
        )
        .then((row) => {
          const revision = Number(row?.revision) || 0;
          for (const response of listeners) {
            try {
              sendEvent(response, revision, now);
            } catch {
              listeners.delete(response);
            }
          }
        })
        .catch((error) =>
          console.error("Content revision update failed:", error),
        );
    });
    next();
  };
}

module.exports = { createContentSyncRouter, createContentRevisionMiddleware };
