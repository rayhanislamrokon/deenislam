const express = require("express");
const jwt = require("jsonwebtoken");

const defaults = {
  ayah: {
    sourceType: "quran",
    surahNumber: 94,
    ayahNumber: 6,
    arabic: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا",
    translation: "Indeed, with hardship comes ease.",
    source: "Surah Ash-Sharh (94:6)",
    link: "/quran",
    published: true,
  },
  hadith: {
    sourceType: "hadith",
    hadithId: "",
    arabic: "مَنْ دَلَّ عَلَى خَيْرٍ فَلَهُ مِثْلُ أَجْرِ فَاعِلِهِ",
    translation: "Whoever guides someone to goodness will have a reward like the one who does it.",
    source: "Sahih Muslim (1893)",
    link: "/hadith",
    published: true,
  },
};

const text = (value, max) => String(value || "").trim().slice(0, max);
function authenticate(req, secret) {
  try {
    const token = String(req.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const payload = jwt.verify(token, secret);
    const allowed = payload.role === "admin" && (payload.adminRole === "super_admin" || payload.permissions?.includes("*") || payload.permissions?.includes("notifications.manage"));
    return allowed ? payload : null;
  } catch { return null; }
}
function cleanCard(input, fallback) {
  return {
    sourceType: fallback.sourceType,
    ...(fallback.sourceType === "quran" ? { surahNumber: Math.max(1, Math.min(114, Number(input?.surahNumber) || fallback.surahNumber)), ayahNumber: Math.max(1, Number(input?.ayahNumber) || fallback.ayahNumber) } : { hadithId: text(input?.hadithId, 80) }),
    arabic: text(input?.arabic, 800) || fallback.arabic,
    translation: text(input?.translation, 1200) || fallback.translation,
    source: text(input?.source, 240) || fallback.source,
    link: text(input?.link, 500) || fallback.link,
    published: input?.published !== false,
  };
}
function publicData(item) {
  const stored = item?.dailyFeaturedContent || {};
  return {
    ayah: { ...defaults.ayah, ...(stored.ayah || {}) },
    hadith: { ...defaults.hadith, ...(stored.hadith || {}) },
  };
}

const language = value => /^[a-z]{2,3}(?:-[a-z]{2,8})?$/i.test(String(value || "")) ? String(value).toLowerCase() : "en";
async function localizedData(item, lang, sources) {
  const data = publicData(item);
  if (data.ayah.surahNumber && data.ayah.ayahNumber) {
    const surah = await sources.surahs().findOne({ number: Number(data.ayah.surahNumber) }, { projection: { _id: 0 } });
    const ayah = surah?.ayahs?.find(row => Number(row.numberInSurah) === Number(data.ayah.ayahNumber));
    if (ayah) data.ayah = { ...data.ayah, arabic: ayah.text || data.ayah.arabic, translation: (lang === "ar" ? ayah.text : ayah.translations?.[lang] || ayah.translation || ayah.translations?.en) || data.ayah.translation, source: `${surah.englishName || surah.name || "Surah"} (${surah.number}:${ayah.numberInSurah})`, link: `/quran/surah-${surah.number}` };
  }
  if (data.hadith.hadithId) {
    const { ObjectId } = require("mongodb");
    if (ObjectId.isValid(data.hadith.hadithId)) {
      const row = await sources.hadith().findOne({ _id: new ObjectId(data.hadith.hadithId), published: { $ne: false } });
      const translated = lang === "en" ? null : row?.translations?.[lang];
      if (row) data.hadith = { ...data.hadith, arabic: row.arabic || data.hadith.arabic, translation: (lang === "ar" ? row.arabic : translated?.text || row.text) || data.hadith.translation, source: translated?.reference || translated?.source || row.reference || row.source || `${row.collectionName || "Hadith"} ${row.hadithNumber || ""}`.trim(), link: `/hadith/${row.collectionId || ""}` };
    }
  }
  return data;
}

function createDailyFeaturedContentRouter(getSettings, jwtSecret, sources) {
  const router = express.Router();
  router.get("/api/daily-featured-content", async (_req, res) => {
    try {
      const item = await getSettings().findOne({ _id: "primary" }, { projection: { dailyFeaturedContent: 1 } });
      res.set("Cache-Control", "no-store");
      res.json({ data: await localizedData(item, language(_req.query.language), sources) });
    } catch (error) {
      console.error("Daily featured content load failed:", error);
      res.status(500).json({ message: "Unable to load daily content." });
    }
  });
  router.use("/api/admin/daily-featured-content", (req, res, next) => {
    const admin = authenticate(req, jwtSecret);
    if (!admin) return res.status(403).json({ message: "Home content permission is required." });
    req.dailyFeaturedAdmin = admin;
    next();
  });
  router.get("/api/admin/daily-featured-content", async (_req, res) => {
    try {
      const item = await getSettings().findOne({ _id: "primary" }, { projection: { dailyFeaturedContent: 1 } });
      res.json({ data: publicData(item) });
    } catch { res.status(500).json({ message: "Unable to load daily content." }); }
  });
  router.put("/api/admin/daily-featured-content", async (req, res) => {
    try {
      const dailyFeaturedContent = {
        ayah: cleanCard(req.body?.ayah, defaults.ayah),
        hadith: cleanCard(req.body?.hadith, defaults.hadith),
        updatedAt: new Date(),
        updatedBy: req.dailyFeaturedAdmin?.email || "",
      };
      await getSettings().updateOne({ _id: "primary" }, { $set: { dailyFeaturedContent }, $setOnInsert: { createdAt: new Date() } }, { upsert: true });
      res.json({ data: dailyFeaturedContent, message: "Daily Ayah and Hadith published successfully." });
    } catch (error) {
      console.error("Daily featured content save failed:", error);
      res.status(500).json({ message: "Unable to save daily content." });
    }
  });
  return router;
}

module.exports = { createDailyFeaturedContentRouter };
