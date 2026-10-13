const express = require("express");
const jwt = require("jsonwebtoken");

const defaults = {
  title: "About DeenIslam",
  subtitle: "Your daily Islamic companion",
  body: `<p>DeenIslam is a complete Islamic companion designed to help Muslims build a consistent and meaningful daily worship routine. Our goal is to make authentic Islamic learning and essential worship tools easy to access in one peaceful, user-friendly app.</p>
<h3>WHAT YOU CAN DO</h3>
<p>Read the Quran with translations, explore verified Tafsir and Hadith, check prayer times, find the Qibla direction, read daily duas and amol, use Tasbih, calculate Zakat, discover nearby mosques, and continue beneficial Islamic learning.</p>
<h3>DAILY WORSHIP JOURNEY</h3>
<p>The Daily Prayer section helps you follow assigned salah and worship tasks, complete daily duas and dhikr, continue Quran reading, learn something new, record good deeds, and monitor your progress over time.</p>
<h3>TRUSTED AND MANAGED CONTENT</h3>
<p>Dynamic content is managed through the connected DeenIslam administration system. Authorized administrators can add, update, organize or remove relevant content so the app can continue improving without requiring a new app release for every content change.</p>
<h3>OUR APPROACH</h3>
<p>DeenIslam is designed with clarity, respect and accessibility in mind. We aim to provide a calm experience that encourages small, consistent good deeds and helps users remain connected to Allah throughout the day.</p>
<h3>IMPORTANT NOTE</h3>
<p>DeenIslam provides Islamic information for education and general guidance. For personal religious rulings, complex questions or matters of scholarly difference, please consult a qualified and trusted Islamic scholar.</p>`,
  published: true,
};
const clean = (value, max) =>
  String(value || "")
    .trim()
    .slice(0, max);
function auth(req, secret) {
  const raw = String(req.get("authorization") || "").replace(/^Bearer\s+/i, "");
  try {
    const p = jwt.verify(raw, secret);
    return p.role === "admin" ? p : null;
  } catch {
    return null;
  }
}
function canManage(p) {
  return (
    p &&
    (p.adminRole === "super_admin" ||
      p.permissions?.includes("*") ||
      p.permissions?.includes("settings.manage"))
  );
}
const publicContent = (item) => ({ ...defaults, ...(item?.aboutPage || {}) });

function createAboutContentRouter(getSettings, jwtSecret) {
  const router = express.Router();
  router.get("/api/about-content", async (_req, res) => {
    try {
      const item = await getSettings().findOne(
        { _id: "primary" },
        { projection: { aboutPage: 1 } },
      );
      const data = publicContent(item);
      res.set("Cache-Control", "no-store");
      res.json({ data: data.published === false ? defaults : data });
    } catch (error) {
      console.error("About content public load failed:", error);
      res.status(500).json({ message: "Unable to load About content." });
    }
  });
  router.use("/api/admin/about-content", (req, res, next) => {
    const p = auth(req, jwtSecret);
    if (!canManage(p))
      return res
        .status(403)
        .json({ message: "Settings permission is required." });
    req.aboutAdmin = p;
    next();
  });
  router.get("/api/admin/about-content", async (_req, res) => {
    try {
      const item = await getSettings().findOne(
        { _id: "primary" },
        { projection: { aboutPage: 1 } },
      );
      res.json({ data: publicContent(item) });
    } catch (error) {
      res.status(500).json({ message: "Unable to load About content." });
    }
  });
  router.put("/api/admin/about-content", async (req, res) => {
    try {
      const aboutPage = {
        title: clean(req.body.title, 100) || defaults.title,
        subtitle: clean(req.body.subtitle, 180) || defaults.subtitle,
        body: clean(req.body.body, 12000) || defaults.body,
        published: req.body.published !== false,
        updatedAt: new Date(),
        updatedBy: req.aboutAdmin?.email || "",
      };
      await getSettings().updateOne(
        { _id: "primary" },
        { $set: { aboutPage }, $setOnInsert: { createdAt: new Date() } },
        { upsert: true },
      );
      res.json({ data: aboutPage, message: "About page content saved." });
    } catch (error) {
      console.error("About content save failed:", error);
      res.status(500).json({ message: "Unable to save About content." });
    }
  });
  return router;
}
module.exports = { createAboutContentRouter };
