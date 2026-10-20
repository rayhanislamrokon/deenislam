const express = require("express");
const jwt = require("jsonwebtoken");
const { deleteReplacedImages, deleteStoredImages } = require("./s3-books");

const TYPES = [
  "dua",
  "duas",
  "dhikr",
  "quran",
  "tafsir",
  "hadith",
  "books",
  "islamicLifestyle",
  "prophets",
  "sahaba",
  "islamicHistory",
  "lesson",
  "goodDeed",
  "reflection",
];
const clean = (value, max = 180) =>
  String(value || "")
    .trim()
    .slice(0, max);
const validDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
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
      p.permissions?.includes("daily_prayer.manage"))
  );
}
function normalize(body, date) {
  const tasks = (Array.isArray(body.tasks) ? body.tasks : [])
    .slice(0, 20)
    .map((item, index) => ({
      id: clean(item.id, 80) || `task-${index + 1}`,
      type: TYPES.includes(item.type) ? item.type : "goodDeed",
      title: clean(item.title, 120),
      subtitle: clean(item.subtitle, 240),
      instruction: clean(item.instruction, 1000),
      detailArabic: clean(item.detailArabic, 2000),
      detailMeaning: clean(item.detailMeaning, 4000),
      surahNumber:
        item.surahNumber == null
          ? undefined
          : Math.max(
              1,
              Math.min(114, Math.floor(Number(item.surahNumber) || 1)),
            ),
      surahName: clean(item.surahName, 120),
      startAyah:
        item.startAyah == null
          ? undefined
          : Math.max(1, Math.floor(Number(item.startAyah) || 1)),
      ayahCount:
        item.ayahCount == null
          ? undefined
          : Math.max(1, Math.floor(Number(item.ayahCount) || 1)),
      maxAyahs:
        item.maxAyahs == null
          ? undefined
          : Math.max(1, Math.floor(Number(item.maxAyahs) || 1)),
      imageUrl: clean(item.imageUrl, 2000),
      imageKey: clean(item.imageKey, 1000),
      rewardPoints: Math.min(
        1000,
        Math.max(0, Math.floor(Number(item.rewardPoints) || 0)),
      ),
      target:
        item.target == null
          ? undefined
          : Math.min(100000, Math.max(1, Math.floor(Number(item.target) || 1))),
      contentId: clean(item.contentId, 160),
      order: index,
    }))
    .filter((item) => item.title);
  const prayers = (Array.isArray(body.prayers) ? body.prayers : [])
    .slice(0, 5)
    .map((item, index) => ({
      id: ["fajr", "dhuhr", "asr", "maghrib", "isha"][index],
      name: ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"][index],
      time: clean(item.time, 20),
    }));
  return {
    date,
    greetingTitle: clean(body.greetingTitle, 80) || "Assalamu Alaikum",
    greetingSubtitle:
      clean(body.greetingSubtitle, 160) || "May Allah make today easy for you",
    quote: clean(body.quote, 500),
    quoteReference: clean(body.quoteReference, 120),
    focusText: clean(body.focusText, 300),
    tasks,
    prayers,
    published: body.published !== false,
    updatedAt: new Date(),
  };
}
function publicPlan(item) {
  if (!item) return null;
  const { _id, ...data } = item;
  return { id: _id.toString(), ...data };
}
function createDailyPrayerRouter(
  getCollection,
  jwtSecret,
  getSources = () => ({}),
) {
  const router = express.Router();
  router.get("/api/daily-prayer/today", async (req, res) => {
    res.set("Cache-Control", "no-store");
    try {
      const date = validDate(req.query.date)
        ? String(req.query.date)
        : new Date().toISOString().slice(0, 10);
      const item = await getCollection().findOne({ date, published: true });
      res.json({ data: publicPlan(item) });
    } catch (error) {
      console.error("Daily prayer public load failed:", error);
      res.status(500).json({ message: "Unable to load today's plan." });
    }
  });
  router.use("/api/admin/daily-prayer", (req, res, next) => {
    const p = auth(req, jwtSecret);
    if (!canManage(p))
      return res
        .status(403)
        .json({ message: "Daily Prayer permission is required." });
    req.dailyPrayerAdmin = p;
    next();
  });
  router.get("/api/admin/daily-prayer/content-options", async (req, res) => {
    try {
      const type = String(req.query.type || "dua"),
        s = getSources(),
        planCollection = getCollection(),
        db = planCollection.client.db(planCollection.dbName),
        source = (key, name) => s[key] || db.collection(name);
      let rows = [];
      if (type === "dua" || type === "duas" || type === "dhikr")
        rows = await source("duas", "dua_content")
          .find({})
          .sort({ order: 1, name: 1 })
          .toArray();
      else if (type === "quran")
        rows = await source("surahs", "surahs")
          .find(
            {},
            {
              projection: {
                _id: 0,
                number: 1,
                name: 1,
                englishName: 1,
                englishNameTranslation: 1,
                numberOfAyahs: 1,
              },
            },
          )
          .sort({ number: 1 })
          .toArray();
      else if (type === "tafsir")
        rows = await source("tafsir", "tafsir_content")
          .find({ recordType: "commentary" })
          .sort({ surahNumber: 1, ayahNumber: 1 })
          .limit(1000)
          .toArray();
      else if (type === "hadith")
        rows = await source("hadith", "hadith_content")
          .find({ recordType: { $ne: "collection" } })
          .sort({ collectionId: 1, hadithNumber: 1 })
          .limit(1000)
          .toArray();
      else if (type === "books")
        rows = await source("books", "books")
          .find({ category: { $not: /sahaba/i } })
          .sort({ category: 1, title: 1 })
          .toArray();
      else if (type === "sahaba")
        rows = await source("books", "books")
          .find({ category: /sahaba/i })
          .sort({ title: 1 })
          .toArray();
      else if (type === "prophets")
        rows = await source("prophets", "prophets_content")
          .find({})
          .sort({ order: 1, name: 1 })
          .toArray();
      else if (type === "islamicHistory")
        rows = await source("history", "islamic_history")
          .find({})
          .sort({ order: 1, title: 1 })
          .toArray();
      else
        rows = await source("lifestyle", "islamic_lifestyle")
          .find({ kind: { $ne: "category" } })
          .sort({ section: 1, order: 1, title: 1 })
          .toArray();
      res.json({
        data: rows.map((item) => ({
          ...item,
          id: item._id ? String(item._id) : item.id,
          _id: undefined,
        })),
      });
    } catch (error) {
      console.error("Daily Prayer content options failed:", error);
      res.status(500).json({ message: "Unable to load uploaded content." });
    }
  });
  router.get("/api/admin/daily-prayer/quran/:number", async (req, res) => {
    try {
      const number = Number(req.params.number),
        surah = await getSources().surahs.findOne(
          { number },
          { projection: { _id: 0 } },
        );
      if (!surah) return res.status(404).json({ message: "Surah not found." });
      res.json({ data: surah });
    } catch (error) {
      res.status(500).json({ message: "Unable to load Surah ayahs." });
    }
  });
  router.get("/api/admin/daily-prayer", async (req, res) => {
    try {
      const items = await getCollection()
        .find({})
        .sort({ date: -1 })
        .limit(120)
        .toArray();
      res.json({ data: items.map(publicPlan) });
    } catch (error) {
      res.status(500).json({ message: "Unable to load Daily Prayer plans." });
    }
  });
  router.put("/api/admin/daily-prayer/:date", async (req, res) => {
    try {
      const date = String(req.params.date || "");
      if (!validDate(date))
        return res
          .status(400)
          .json({ message: "Use a valid YYYY-MM-DD date." });
      const plan = normalize(req.body, date);
      if (!plan.tasks.length)
        return res
          .status(400)
          .json({ message: "Add at least one daily task." });
      const actor = req.dailyPrayerAdmin?.email || "";
      const existing = await getCollection().findOne({ date });
      await getCollection().updateOne(
        { date },
        {
          $set: { ...plan, updatedBy: actor },
          $setOnInsert: { createdAt: new Date(), createdBy: actor },
        },
        { upsert: true },
      );
      const item = await getCollection().findOne({ date });
      await deleteReplacedImages(existing, item);
      res.json({ data: publicPlan(item), message: "Daily Prayer plan saved." });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Unable to save Daily Prayer plan." });
    }
  });
  router.delete("/api/admin/daily-prayer/:date", async (req, res) => {
    try {
      const date = String(req.params.date || "");
      const item = await getCollection().findOne({ date });
      if (!item)
        return res
          .status(404)
          .json({ message: "Daily Prayer plan not found." });
      await deleteStoredImages(item);
      await getCollection().deleteOne({ date });
      res.json({ message: "Daily Prayer plan deleted.", data: { date } });
    } catch (error) {
      res.status(500).json({ message: "Unable to delete Daily Prayer plan." });
    }
  });
  return router;
}
module.exports = { createDailyPrayerRouter };
