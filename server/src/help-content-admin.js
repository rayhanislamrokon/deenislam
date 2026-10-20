const express = require("express");
const jwt = require("jsonwebtoken");

const defaults = {
  title: "Help Center",
  subtitle: "Answers, guidance and support for DeenIslam",
  body: `<h3>GETTING STARTED</h3><p>Use the Home screen to open Quran, Hadith, prayer times, Qibla, Islamic books and other DeenIslam features.</p><h3>QURAN &amp; AUDIO</h3><p>Open Quran to read a Surah, select a translation, choose a reciter and listen to audio. Use Bookmarks and Downloads to keep supported content easy to find.</p><h3>PRAYER TIMES &amp; QIBLA</h3><p>Allow location access for relevant prayer times and Qibla direction. Results can vary by calculation method and location settings.</p><h3>ACCOUNT &amp; SECURITY</h3><p>Open Profile to manage your account, password, subscription and saved preferences. Never share your password or verification codes.</p><h3>CONTACT SUPPORT</h3><p>If you still need help, email <a href="mailto:info@deenislam.com">info@deenislam.com</a> from your registered email address and include a clear description of the issue.</p>`,
  published: true,
};
const clean = (value, max) => String(value || "").trim().slice(0, max);
const publicContent = (item) => ({ ...defaults, ...(item?.helpPage || {}) });

function auth(req, secret) {
  const raw = String(req.get("authorization") || "").replace(/^Bearer\s+/i, "");
  try { const payload = jwt.verify(raw, secret); return payload.role === "admin" ? payload : null; } catch { return null; }
}
function canManage(payload) {
  return payload && (payload.adminRole === "super_admin" || payload.permissions?.includes("*") || payload.permissions?.includes("settings.manage") || payload.permissions?.includes("privacy.manage"));
}

function createHelpContentRouter(getSettings, jwtSecret) {
  const router = express.Router();
  router.get("/api/help-content", async (_req, res) => {
    try {
      const item = await getSettings().findOne({ _id: "primary" }, { projection: { helpPage: 1 } });
      const data = publicContent(item);
      res.set("Cache-Control", "no-store");
      res.json({ data: data.published === false ? defaults : data });
    } catch { res.status(500).json({ message: "Unable to load Help Center." }); }
  });
  router.use("/api/admin/help-content", (req, res, next) => {
    const payload = auth(req, jwtSecret);
    if (!canManage(payload)) return res.status(403).json({ message: "Settings permission is required." });
    req.helpAdmin = payload;
    next();
  });
  router.get("/api/admin/help-content", async (_req, res) => {
    try {
      const item = await getSettings().findOne({ _id: "primary" }, { projection: { helpPage: 1 } });
      res.json({ data: publicContent(item) });
    } catch { res.status(500).json({ message: "Unable to load Help Center." }); }
  });
  router.put("/api/admin/help-content", async (req, res) => {
    try {
      const helpPage = { title: clean(req.body.title, 100) || defaults.title, subtitle: clean(req.body.subtitle, 180) || defaults.subtitle, body: clean(req.body.body, 16000) || defaults.body, published: req.body.published !== false, updatedAt: new Date(), updatedBy: req.helpAdmin?.email || "" };
      await getSettings().updateOne({ _id: "primary" }, { $set: { helpPage }, $setOnInsert: { createdAt: new Date() } }, { upsert: true });
      res.json({ data: helpPage, message: "Help Center saved." });
    } catch { res.status(500).json({ message: "Unable to save Help Center." }); }
  });
  return router;
}

module.exports = { createHelpContentRouter };
