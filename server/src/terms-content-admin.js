const express = require("express");
const jwt = require("jsonwebtoken");

const defaults = {
  title: "Terms & Conditions",
  subtitle: "Guidelines for using DeenIslam",
  body: `<h3>ACCEPTANCE OF TERMS</h3><p>By using DeenIslam, you agree to these Terms & Conditions and all applicable laws. If you do not agree with these terms, please discontinue use of the app and its services.</p><h3>SERVICE AND ISLAMIC CONTENT</h3><p>DeenIslam provides Islamic educational content, Quran, Hadith, prayer tools and worship-support resources for learning and general guidance. This content is not a substitute for advice from a qualified Islamic scholar, legal professional or medical professional.</p><h3>ACCEPTABLE USE</h3><p>You may not misuse the service, attempt unauthorized access, disrupt its operation, copy or scrape protected content, interfere with other users, or use the app for unlawful, misleading or harmful activities.</p><h3>ACCOUNTS AND SECURITY</h3><p>You are responsible for maintaining the confidentiality of your account and login information and for activities performed through your account.</p><h3>CONTENT AND INTELLECTUAL PROPERTY</h3><p>App design, software and protected content remain the property of DeenIslam or their respective rights holders.</p><h3>THIRD-PARTY SERVICES</h3><p>Some features may rely on third-party services. Their own terms and privacy policies may apply.</p><h3>AVAILABILITY AND UPDATES</h3><p>Features, content and availability may change as the service develops.</p><h3>CONTACT</h3><p>For questions about these Terms & Conditions, use the Help & Support contact information provided in DeenIslam.</p>`,
  published: true,
};
const clean = (value, max) => String(value || "").trim().slice(0, max);
const publicContent = (item) => ({ ...defaults, ...(item?.termsPage || {}) });

function auth(req, secret) {
  const raw = String(req.get("authorization") || "").replace(/^Bearer\s+/i, "");
  try { const payload = jwt.verify(raw, secret); return payload.role === "admin" ? payload : null; } catch { return null; }
}
function canManage(payload) {
  return payload && (payload.adminRole === "super_admin" || payload.permissions?.includes("*") || payload.permissions?.includes("settings.manage") || payload.permissions?.includes("privacy.manage"));
}

function createTermsContentRouter(getSettings, jwtSecret) {
  const router = express.Router();
  router.get("/api/terms-content", async (_req, res) => {
    try {
      const item = await getSettings().findOne({ _id: "primary" }, { projection: { termsPage: 1 } });
      const data = publicContent(item);
      res.set("Cache-Control", "no-store");
      res.json({ data: data.published === false ? defaults : data });
    } catch { res.status(500).json({ message: "Unable to load Terms & Conditions." }); }
  });
  router.use("/api/admin/terms-content", (req, res, next) => {
    const payload = auth(req, jwtSecret);
    if (!canManage(payload)) return res.status(403).json({ message: "Settings permission is required." });
    req.termsAdmin = payload;
    next();
  });
  router.get("/api/admin/terms-content", async (_req, res) => {
    try {
      const item = await getSettings().findOne({ _id: "primary" }, { projection: { termsPage: 1 } });
      res.json({ data: publicContent(item) });
    } catch { res.status(500).json({ message: "Unable to load Terms & Conditions." }); }
  });
  router.put("/api/admin/terms-content", async (req, res) => {
    try {
      const termsPage = { title: clean(req.body.title, 100) || defaults.title, subtitle: clean(req.body.subtitle, 180) || defaults.subtitle, body: clean(req.body.body, 16000) || defaults.body, published: req.body.published !== false, updatedAt: new Date(), updatedBy: req.termsAdmin?.email || "" };
      await getSettings().updateOne({ _id: "primary" }, { $set: { termsPage }, $setOnInsert: { createdAt: new Date() } }, { upsert: true });
      res.json({ data: termsPage, message: "Terms & Conditions saved." });
    } catch { res.status(500).json({ message: "Unable to save Terms & Conditions." }); }
  });
  return router;
}

module.exports = { createTermsContentRouter };
