const express = require("express");
const jwt = require("jsonwebtoken");
const { deleteReplacedImages, deleteStoredImages } = require("./s3-books");
const STATIC_HADITHS = require("../../web/app/data/hadeethenc-en.json");

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
const cleanRichText = (value) =>
  String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
async function loadTafsirRange(collection, sourceId, surahNumber, start, end) {
  const stored = await collection
    .find({ recordType: "commentary", sourceId, surahNumber, ayahNumber: { $gte: start, $lte: end }, published: { $ne: false } })
    .sort({ ayahNumber: 1 })
    .toArray();
  const byAyah = new Map(stored.map((row) => [Number(row.ayahNumber), row]));
  if (/^\d+$/.test(sourceId)) {
    await Promise.all(Array.from({ length: end - start + 1 }, (_, index) => start + index).map(async (ayahNumber) => {
      if (byAyah.has(ayahNumber)) return;
      try {
        const response = await fetch(`https://api.quran.com/api/v4/tafsirs/${sourceId}/by_ayah/${surahNumber}:${ayahNumber}`);
        if (!response.ok) return;
        const json = await response.json();
        const record = json.tafsir?.text ? json.tafsir : Object.values(json.tafsir?.verses || {})[0];
        if (record?.text) byAyah.set(ayahNumber, { ayahNumber, surahNumber, sourceId, sourceName: json.tafsir?.resource_name || "Quran.com", text: cleanRichText(record.text) });
      } catch {}
    }));
  }
  return [...byAyah.values()].sort((a, b) => Number(a.ayahNumber) - Number(b.ayahNumber));
}
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
      hadithCollection: clean(item.hadithCollection, 180),
      hadithNumber: clean(item.hadithNumber, 80),
      tafsirSourceId: clean(item.tafsirSourceId, 100),
      tafsirSourceName: clean(item.tafsirSourceName, 240),
      ayahs: (Array.isArray(item.ayahs) ? item.ayahs : [])
        .slice(0, 286)
        .map((ayah, ayahIndex) => ({
          number: Math.max(1, Math.floor(Number(ayah.number) || ayahIndex + 1)),
          arabic: clean(ayah.arabic, 2000),
          pronunciation: clean(ayah.pronunciation, 4000),
          meaning: clean(ayah.meaning, 6000),
        }))
        .filter((ayah) => ayah.arabic || ayah.pronunciation || ayah.meaning),
      tafsirAyahs: (Array.isArray(item.tafsirAyahs) ? item.tafsirAyahs : [])
        .slice(0, 286)
        .map((ayah, ayahIndex) => ({
          number: Math.max(1, Math.floor(Number(ayah.number) || ayahIndex + 1)),
          arabic: clean(ayah.arabic, 2000),
          pronunciation: clean(ayah.pronunciation, 4000),
          meaning: clean(ayah.meaning, 6000),
          text: clean(ayah.text, 12000),
        }))
        .filter((ayah) => ayah.text || ayah.arabic || ayah.meaning),
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
async function hydrateQuranAyahs(item, getSources) {
  if (!item || !Array.isArray(item.tasks)) return item;
  const surahs = getSources()?.surahs;
  if (!surahs) return item;
  const tasks = await Promise.all(
    item.tasks.map(async (task) => {
      if (
        task.type !== "quran" ||
        !task.surahNumber
      )
        return task;
      const surah = await surahs.findOne(
        { number: Number(task.surahNumber) },
        { projection: { _id: 0 } },
      );
      if (!surah || !Array.isArray(surah.ayahs)) return task;
      const start = Math.max(1, Number(task.startAyah) || 1);
      const count = Math.max(1, Number(task.ayahCount) || 1);
      const ayahs = surah.ayahs.slice(start - 1, start - 1 + count).map((ayah, index) => ({
        number: Number(ayah.numberInSurah) || start + index,
        arabic: clean(ayah.text, 2000),
        pronunciation: clean(ayah.pronunciations?.en || ayah.transliteration, 4000),
        meaning: clean(ayah.translations?.en || ayah.translation, 6000),
      }));
      return {
        ...task,
        surahName: task.surahName || surah.englishName || surah.name,
        maxAyahs: task.maxAyahs || surah.numberOfAyahs,
        ayahs,
      };
    }),
  );
  return { ...item, tasks };
}
async function hydrateTafsirAyahs(item, getSources) {
  if (!item || !Array.isArray(item.tasks)) return item;
  const sources = getSources();
  const tafsir = sources?.tafsir;
  if (!tafsir) return item;
  const tasks = await Promise.all(
    item.tasks.map(async (task) => {
      if (task.type !== "tafsir" || !task.surahNumber) return task;
      const start = Math.max(1, Number(task.startAyah) || 1);
      const end = start + Math.max(1, Number(task.ayahCount) || 1) - 1;
      const rows = await loadTafsirRange(tafsir, String(task.tafsirSourceId || ""), Number(task.surahNumber), start, end);
      if (!rows.length) return task;
      const surah = sources.surahs
        ? await sources.surahs.findOne(
            { number: Number(task.surahNumber) },
            { projection: { _id: 0 } },
          )
        : null;
      const quranAyahs = new Map(
        (Array.isArray(surah?.ayahs) ? surah.ayahs : []).map((ayah) => [
          Number(ayah.numberInSurah),
          ayah,
        ]),
      );
      return {
        ...task,
        surahName: task.surahName || surah?.englishName || rows[0].surahName,
        tafsirSourceName: task.tafsirSourceName || rows[0].sourceName,
        tafsirAyahs: rows.map((row) => {
          const quranAyah = quranAyahs.get(Number(row.ayahNumber)) || {};
          return {
            number: Number(row.ayahNumber),
            arabic: clean(quranAyah.text, 2000),
            pronunciation: clean(quranAyah.pronunciations?.en || quranAyah.transliteration, 4000),
            meaning: clean(quranAyah.translations?.en || quranAyah.translation, 6000),
            text: clean(row.text || row.commentary || row.content, 12000),
          };
        }),
      };
    }),
  );
  return { ...item, tasks };
}
async function hydrateHadithTasks(item, getSources) {
  if (!item || !Array.isArray(item.tasks)) return item;
  const collection = getSources()?.hadith;
  const tasks = await Promise.all(
    item.tasks.map(async (task) => {
      if (task.type !== "hadith" || !task.hadithNumber) return task;
      const number = String(task.hadithNumber);
      let row = collection
        ? await collection.findOne({
            recordType: { $ne: "collection" },
            $or: [
              { hadithNumber: number },
              { hadithNumber: Number(number) },
              { id: number },
            ],
          })
        : null;
      if (!row) row = STATIC_HADITHS.find((entry) => String(entry.id) === number);
      if (!row) return task;
      const source = clean(row.collectionName || row.collectionId || task.hadithCollection || "HadeethEnc", 180);
      return {
        ...task,
        title: clean(row.title, 120) || `Hadith ${number}`,
        subtitle: `${source} - Hadith ${number}`,
        instruction: clean(row.reference || row.source || task.instruction, 1000),
        detailArabic: clean(row.arabic || task.detailArabic, 2000),
        detailMeaning: clean(row.text || row.meaning || row.explanation || task.detailMeaning, 10000),
        hadithCollection: source,
      };
    }),
  );
  return { ...item, tasks };
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
      let item = await getCollection().findOne({ date, published: true });
      if (!item) {
        item = await getCollection().findOne(
          { date: { $lte: date }, published: true },
          { sort: { date: -1 } },
        );
      }
      if (!item) return res.json({ data: null });
      item = await hydrateQuranAyahs(item, getSources);
      item = await hydrateTafsirAyahs(item, getSources);
      item = await hydrateHadithTasks(item, getSources);
      const sourceDate = item.date;
      res.json({
        data: {
          ...publicPlan(item),
          date,
          sourceDate,
          reused: sourceDate !== date,
        },
      });
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
      if (type === "hadith" && !rows.length)
        rows = STATIC_HADITHS.slice(0, 1000).map((item) => ({
          ...item,
          title: `Hadith ${item.id}`,
          hadithNumber: item.id,
          reference: item.source,
          published: true,
        }));
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
  router.get("/api/admin/daily-prayer/tafsir-sources", async (req, res) => {
    try {
      const rows = await getSources().tafsir
        .find({ recordType: "source", published: { $ne: false } })
        .sort({ order: 1, name: 1 })
        .toArray();
      res.json({ data: rows.map(({ _id, ...row }) => ({ id: row.sourceId || String(_id), ...row })) });
    } catch {
      res.status(500).json({ message: "Unable to load Tafsir sources." });
    }
  });
  router.get("/api/admin/daily-prayer/tafsir/:sourceId/:surahNumber", async (req, res) => {
    try {
      const start = Math.max(1, Number(req.query.start) || 1);
      const end = Math.max(start, Number(req.query.end) || start);
      const rows = await loadTafsirRange(getSources().tafsir, String(req.params.sourceId), Number(req.params.surahNumber), start, end);
      res.json({ data: rows.map(({ _id, ...row }) => ({ id: String(_id), ...row })) });
    } catch {
      res.status(500).json({ message: "Unable to load Tafsir Ayahs." });
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
