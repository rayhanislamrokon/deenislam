const express = require("express");
const jwt = require("jsonwebtoken");

function createAdminAuditRouter(getLogs, getAdmins, jwtSecret) {
  const router = express.Router();
  const actor = (req) => {
    const raw = String(req.get("authorization") || "").replace(
      /^Bearer\s+/i,
      "",
    );
    if (!raw) return null;
    try {
      const p = jwt.verify(raw, jwtSecret);
      return p.role === "admin" ? p : null;
    } catch {
      return null;
    }
  };
  const canView = (p) =>
    p &&
    (p.adminRole === "super_admin" ||
      p.permissions?.includes("*") ||
      p.permissions?.includes("audit.view"));
  router.get("/api/admin/activity-log", async (req, res) => {
    try {
      const p = actor(req);
      if (!canView(p))
        return res.status(403).json({
          message: "You do not have permission to view admin activity.",
        });
      const limit = Math.min(500, Math.max(20, Number(req.query.limit) || 200)),
        query = {};
      if (req.query.role) query.adminRole = String(req.query.role);
      if (req.query.action) query.action = String(req.query.action);
      if (req.query.email)
        query.email = {
          $regex: String(req.query.email).replace(/[^a-zA-Z0-9@._+-]/g, ""),
          $options: "i",
        };
      const items = await getLogs()
        .find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();
      res.json({
        data: items.map((x) => ({
          ...x,
          id: x._id.toString(),
          _id: undefined,
        })),
      });
    } catch (error) {
      console.error("Admin audit read failed:", error);
      res.status(500).json({ message: "Unable to load admin activity." });
    }
  });
  router.use((req, res, next) => {
    if (
      !req.path.startsWith("/api/admin/") ||
      req.method === "GET" ||
      req.path === "/api/admin/activity-log" ||
      req.get("x-deletion-approval")
    )
      return next();
    const started = Date.now(),
      p = actor(req),
      login = req.path === "/api/admin/login",
      email = login
        ? String(req.body?.email || "")
            .trim()
            .toLowerCase()
        : p?.email || "",
      adminRole = p?.adminRole || (login ? "unknown" : "");
    res.on("finish", () => {
      const action = login
          ? res.statusCode < 400
            ? "login"
            : "login_failed"
          : req.method === "POST"
            ? "create"
            : req.method === "PUT" || req.method === "PATCH"
              ? "update"
              : req.method === "DELETE"
                ? "delete"
                : "action",
        safeKeys = Object.keys(req.body || {})
          .filter(
            (key) =>
              ![
                "password",
                "currentPassword",
                "newPassword",
                "confirmPassword",
                "token",
                "passwordHash",
              ].includes(key),
          )
          .slice(0, 20);
      void (async () => {
        const account =
          login && email
            ? await getAdmins().findOne({ email }, { projection: { role: 1 } })
            : null;
        await getLogs().insertOne({
          email,
          adminRole: account?.role || adminRole,
          action,
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,
          success: res.statusCode < 400,
          changedFields: safeKeys,
          contentLabel: login
            ? ""
            : String(
                req.body?.title ||
                  req.body?.name ||
                  req.body?.duaName ||
                  req.body?.label ||
                  req.body?.heading ||
                  "",
              )
                .trim()
                .slice(0, 180),
          contentId: login
            ? ""
            : String(
                req.body?.slug ||
                  req.body?.key ||
                  req.body?.id ||
                  req.body?.contentId ||
                  decodeURIComponent(
                    req.path.split("/").filter(Boolean).pop() || "",
                  ),
              )
                .trim()
                .slice(0, 180),
          contentCategory: login
            ? ""
            : String(
                req.body?.category ||
                  req.body?.type ||
                  req.body?.collection ||
                  "",
              )
                .trim()
                .slice(0, 100),
          contentLanguage: login
            ? ""
            : String(req.body?.language || req.body?.languageCode || "")
                .trim()
                .slice(0, 80),
          ip: String(req.ip || req.socket?.remoteAddress || "").slice(0, 100),
          userAgent: String(req.get("user-agent") || "").slice(0, 300),
          durationMs: Date.now() - started,
          createdAt: new Date(),
        });
      })().catch((error) => console.error("Admin audit write failed:", error));
    });
    next();
  });
  return router;
}
const DAY_MS = 24 * 60 * 60 * 1000;
function startAdminAuditCleanup(
  getLogs,
  { retentionDays = 30, cleanupEveryDays = 15 } = {},
) {
  const cleanup = async () => {
    const cutoff = new Date(Date.now() - retentionDays * DAY_MS);
    const result = await getLogs().deleteMany({ createdAt: { $lt: cutoff } });
    if (result.deletedCount)
      console.log(
        `Admin audit cleanup removed ${result.deletedCount} record(s) older than ${retentionDays} days.`,
      );
  };
  void cleanup().catch((error) =>
    console.error("Admin audit cleanup failed:", error),
  );
  const timer = setInterval(() => {
    void cleanup().catch((error) =>
      console.error("Admin audit cleanup failed:", error),
    );
  }, cleanupEveryDays * DAY_MS);
  if (typeof timer.unref === "function") timer.unref();
  return timer;
}
module.exports = { createAdminAuditRouter, startAdminAuditCleanup };
