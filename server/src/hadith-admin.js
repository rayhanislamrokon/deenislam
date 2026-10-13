const express = require("express");
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");
const path = require("path");
const { gunzipSync } = require("zlib");
const COMMENTARIES = require(
  path.join(__dirname, "../../app/src/data/hadeethenc-en.json"),
);
const STOP = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "of",
  "to",
  "in",
  "is",
  "was",
  "were",
  "be",
  "been",
  "by",
  "for",
  "from",
  "that",
  "this",
  "with",
  "his",
  "her",
  "him",
  "he",
  "she",
  "they",
  "it",
  "may",
  "allah",
  "upon",
  "said",
  "reported",
  "messenger",
  "prophet",
  "peace",
  "blessings",
]);
const words = (value) =>
  new Set(
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, " ")
      .split(/\s+/)
      .filter((x) => x.length > 2 && !STOP.has(x)),
  );
function findCommentary(text) {
  const target = words(text);
  if (target.size < 3) return null;
  let best = null,
    bestScore = 0;
  for (const row of COMMENTARIES) {
    const candidate = words(row.text);
    let shared = 0;
    target.forEach((word) => {
      if (candidate.has(word)) shared++;
    });
    const score = shared / Math.min(target.size, candidate.size);
    if (shared >= 4 && score > bestScore) {
      best = row;
      bestScore = score;
    }
  }
  return bestScore >= 0.5 ? best : null;
}
const clean = (v, n = 12000) =>
  String(v ?? "")
    .trim()
    .slice(0, n);
const language = (v) => {
  const x = clean(v, 20).toLowerCase();
  return /^[a-z]{2,3}(?:-[a-z]{2,8})?$/.test(x) ? x : "en";
};
const DEFAULT_COLLECTIONS = [
  {
    collectionId: "b",
    collectionName: "Sahih al-Bukhari",
    arabicTitle: "صحيح البخاري",
    author: "Imam Muhammad al-Bukhari",
    hadithCount: 7580,
    category: "Major",
    languages: ["English", "Arabic", "Bengali"],
    mark: "بخ",
  },
  {
    collectionId: "m",
    collectionName: "Sahih Muslim",
    arabicTitle: "صحيح مسلم",
    author: "Imam Muslim ibn al-Hajjaj",
    hadithCount: 7459,
    category: "Major",
    languages: ["English", "Arabic"],
    mark: "مس",
  },
  {
    collectionId: "a",
    collectionName: "Sunan Abu Dawood",
    arabicTitle: "سنن أبي داود",
    author: "Imam Abu Dawood",
    hadithCount: 5272,
    category: "Major",
    languages: ["English", "Arabic"],
    mark: "د",
  },
  {
    collectionId: "t",
    collectionName: "Jami' at-Tirmidhi",
    arabicTitle: "جامع الترمذي",
    author: "Imam Muhammad at-Tirmidhi",
    hadithCount: 3924,
    category: "Major",
    languages: ["English", "Arabic"],
    mark: "تر",
  },
  {
    collectionId: "s",
    collectionName: "Sunan an-Nasa'i",
    arabicTitle: "سنن النسائي",
    author: "Imam Ahmad an-Nasa'i",
    hadithCount: 5679,
    category: "Major",
    languages: ["English", "Arabic"],
    mark: "نس",
  },
  {
    collectionId: "i",
    collectionName: "Sunan Ibn Majah",
    arabicTitle: "سنن ابن ماجه",
    author: "Imam Ibn Majah",
    hadithCount: 4338,
    category: "Major",
    languages: ["English", "Arabic"],
    mark: "مج",
  },
  {
    collectionId: "malik",
    collectionName: "Muwatta Malik",
    arabicTitle: "موطأ مالك",
    author: "Imam Malik ibn Anas",
    hadithCount: 1818,
    category: "Classical",
    languages: ["English", "Arabic"],
    mark: "مو",
  },
  {
    collectionId: "q",
    collectionName: "Forty Hadith Qudsi",
    arabicTitle: "الأحاديث القدسية",
    author: "Prophetic narrations from Allah",
    hadithCount: 40,
    category: "Classical",
    languages: ["English", "Arabic"],
    mark: "قد",
  },
  {
    collectionId: "n",
    collectionName: "Forty Hadith Nawawi",
    arabicTitle: "الأربعون النووية",
    author: "Imam Yahya ibn Sharaf an-Nawawi",
    hadithCount: 42,
    category: "Classical",
    languages: ["English", "Arabic"],
    mark: "نو",
  },
];
function createHadithRouter(getCollection, adminKey, jwtSecret) {
  const router = express.Router(),
    admin = (req, res, next) => {
      if (adminKey && req.get("x-admin-key") === adminKey) return next();
      try {
        const token = clean(req.get("authorization"), 500).replace(
            /^Bearer\s+/i,
            "",
          ),
          p = jwt.verify(token, jwtSecret);
        if (p.role !== "admin") throw Error();
        next();
      } catch {
        return res
          .status(401)
          .json({ message: "Admin session is invalid or expired." });
      }
    };
  const fields = (b) => ({
    collectionId: clean(b.collectionId, 30) || "b",
    collectionName: clean(b.collectionName, 160),
    book: clean(b.book, 80) || "1",
    sectionName: clean(b.sectionName, 250),
    hadithNumber: clean(b.hadithNumber, 80),
    title: clean(b.title, 300),
    arabic: clean(b.arabic, 20000),
    pronunciation: clean(b.pronunciation, 20000),
    text: clean(b.text, 30000),
    narrator: clean(b.narrator, 1000),
    grade: clean(b.grade, 500),
    explanation: clean(b.explanation, 30000),
    reference: clean(b.reference, 1000),
    source: clean(b.source, 1000),
    published: b.published !== false,
  });
  const collectionFields = (b) => ({
    recordType: "collection",
    collectionId: clean(b.collectionId, 30)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-"),
    collectionName: clean(b.collectionName, 160),
    arabicTitle: clean(b.arabicTitle, 160),
    author: clean(b.author, 160),
    coverImageUrl: clean(b.coverImageUrl, 2000),
    hadithCount: Math.max(0, Number(b.hadithCount) || 0),
    category: b.category === "Classical" ? "Classical" : "Major",
    languages: Array.isArray(b.languages)
      ? b.languages.map((x) => clean(x, 30)).filter(Boolean)
      : clean(b.languages, 500)
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
    mark: clean(b.mark, 8),
    published: b.published !== false,
    book: "__collection__",
    hadithNumber: "__collection__",
  });
  const ensureDefaultCollections = async () => {
    const now = new Date();
    await getCollection().bulkWrite(
      DEFAULT_COLLECTIONS.map((item) => ({
        updateOne: {
          filter: { recordType: "collection", collectionId: item.collectionId },
          update: {
            $setOnInsert: {
              ...collectionFields(item),
              coverImageUrl: "",
              createdAt: now,
              updatedAt: now,
            },
          },
          upsert: true,
        },
      })),
      { ordered: false },
    );
  };
  router.get("/api/admin/hadith/collections", admin, async (req, res) => {
    try {
      await ensureDefaultCollections();
      const rows = await getCollection()
        .find({ recordType: "collection" })
        .sort({ category: 1, collectionName: 1 })
        .toArray();
      res.json({
        data: rows.map((x) => ({ ...x, id: String(x._id), _id: undefined })),
      });
    } catch (e) {
      res.status(500).json({ message: "Unable to load collection cards." });
    }
  });
  router.post("/api/admin/hadith/collections", admin, async (req, res) => {
    try {
      const row = {
        ...collectionFields(req.body),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      if (!row.collectionId || !row.collectionName)
        return res
          .status(400)
          .json({ message: "Collection ID and title are required." });
      const exists = await getCollection().findOne({
        recordType: "collection",
        collectionId: row.collectionId,
      });
      if (exists)
        return res
          .status(409)
          .json({ message: "This collection ID already exists." });
      const result = await getCollection().insertOne(row);
      res.status(201).json({
        message: "Hadith book card created.",
        data: { ...row, id: String(result.insertedId) },
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Unable to create collection card." });
    }
  });
  router.put("/api/admin/hadith/collections/:id", admin, async (req, res) => {
    try {
      if (!ObjectId.isValid(req.params.id))
        return res.status(400).json({ message: "Invalid collection id." });
      const row = { ...collectionFields(req.body), updatedAt: new Date() };
      if (!row.collectionId || !row.collectionName)
        return res
          .status(400)
          .json({ message: "Collection ID and title are required." });
      await getCollection().updateOne(
        { _id: new ObjectId(req.params.id), recordType: "collection" },
        { $set: row },
      );
      res.json({ message: "Hadith book card updated." });
    } catch (e) {
      res.status(500).json({ message: "Unable to update collection card." });
    }
  });
  router.delete(
    "/api/admin/hadith/collections/:id",
    admin,
    async (req, res) => {
      try {
        if (!ObjectId.isValid(req.params.id))
          return res.status(400).json({ message: "Invalid collection id." });
        const meta = await getCollection().findOne({
          _id: new ObjectId(req.params.id),
          recordType: "collection",
        });
        if (!meta)
          return res
            .status(404)
            .json({ message: "Collection card not found." });
        const used = await getCollection().countDocuments({
          recordType: { $ne: "collection" },
          collectionId: meta.collectionId,
        });
        if (used)
          return res.status(409).json({
            message: `Delete or move the ${used} Hadith records in this collection first.`,
          });
        await getCollection().deleteOne({ _id: meta._id });
        res.json({ message: "Collection card deleted." });
      } catch (e) {
        res.status(500).json({ message: "Unable to delete collection card." });
      }
    },
  );
  router.get("/api/hadith/collection-cards", async (req, res) => {
    try {
      await ensureDefaultCollections();
      const rows = await getCollection()
        .find({ recordType: "collection", published: { $ne: false } })
        .sort({ category: 1, collectionName: 1 })
        .toArray();
      res.set(
        "Cache-Control",
        "public, max-age=60, stale-while-revalidate=300",
      );
      res.json({
        data: rows.map((x) => ({
          id: x.collectionId,
          title: x.collectionName,
          arabic: x.arabicTitle || "",
          author: x.author || "",
          coverImageUrl: x.coverImageUrl || "",
          hadiths: x.hadithCount || 0,
          category: x.category || "Major",
          languages: x.languages || [],
          mark: x.mark || "",
        })),
      });
    } catch (e) {
      res.status(500).json({ message: "Unable to load collection cards." });
    }
  });
  router.get("/api/admin/hadith", admin, async (req, res) => {
    try {
      const rows = await getCollection()
        .find({ recordType: { $ne: "collection" } }, { projection: {} })
        .sort({ collectionId: 1, book: 1, hadithNumber: 1 })
        .toArray();
      res.json({
        data: rows.map((x) => ({ ...x, id: String(x._id), _id: undefined })),
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Unable to load Hadith content." });
    }
  });
  router.post("/api/admin/hadith", admin, async (req, res) => {
    try {
      const lang = language(req.body.language);
      if (lang !== "en")
        return res
          .status(400)
          .json({ message: "Create the English base Hadith first." });
      const row = {
        ...fields(req.body),
        translations: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      if (!row.hadithNumber || !row.text)
        return res
          .status(400)
          .json({ message: "Hadith number and English text are required." });
      const result = await getCollection().insertOne(row);
      res.status(201).json({
        message: "Hadith saved.",
        data: { ...row, id: String(result.insertedId) },
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Unable to save Hadith." });
    }
  });
  router.put("/api/admin/hadith/:id", admin, async (req, res) => {
    try {
      if (!ObjectId.isValid(req.params.id))
        return res.status(400).json({ message: "Invalid Hadith id." });
      const lang = language(req.body.language),
        id = new ObjectId(req.params.id),
        current = await getCollection().findOne({ _id: id });
      if (!current)
        return res.status(404).json({ message: "Hadith not found." });
      if (lang === "en")
        await getCollection().updateOne(
          { _id: id },
          { $set: { ...fields(req.body), updatedAt: new Date() } },
        );
      else
        await getCollection().updateOne(
          { _id: id },
          {
            $set: {
              [`translations.${lang}`]: fields({ ...current, ...req.body }),
              updatedAt: new Date(),
            },
          },
        );
      res.json({
        message:
          lang === "en"
            ? "English Hadith updated."
            : `${lang.toUpperCase()} translation saved.`,
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Unable to update Hadith." });
    }
  });
  router.delete("/api/admin/hadith/:id", admin, async (req, res) => {
    try {
      if (!ObjectId.isValid(req.params.id))
        return res.status(400).json({ message: "Invalid Hadith id." });
      await getCollection().deleteOne({ _id: new ObjectId(req.params.id) });
      res.json({ message: "Hadith deleted." });
    } catch (e) {
      res.status(500).json({ message: "Unable to delete Hadith." });
    }
  });
  router.get("/api/hadith/admin-content", async (req, res) => {
    try {
      const lang = language(req.query.language),
        rows = await getCollection()
          .find({
            recordType: { $ne: "collection" },
            published: { $ne: false },
          })
          .sort({ collectionId: 1, book: 1, hadithNumber: 1 })
          .toArray();
      res.json({
        data: rows.map((row) => {
          const t = lang === "en" ? null : row.translations?.[lang];
          return {
            id: String(row._id),
            cid: row.collectionId,
            no: row.hadithNumber,
            title: t?.title || row.title || `Hadith ${row.hadithNumber}`,
            text: t?.text || row.text,
            arabic: row.arabic,
            pronunciation: t?.pronunciation || row.pronunciation || "",
            by: t?.narrator || row.narrator,
            book: row.book,
            sectionName: t?.sectionName || row.sectionName,
            grade: t?.grade || row.grade,
            explanation: t?.explanation || row.explanation,
            reference: t?.reference || row.reference,
            source: t?.source || row.source,
            language: t ? lang : "en",
            hasTranslation: Boolean(t),
          };
        }),
      });
    } catch (e) {
      res.status(500).json({ message: "Unable to load Hadith content." });
    }
  });
  router.get("/api/hadith/collections/:collectionId", async (req, res) => {
    try {
      const books = {
          b: "bukhari",
          m: "muslim",
          a: "abudawud",
          t: "tirmidhi",
          s: "nasai",
          i: "ibnmajah",
          malik: "malik",
          n: "nawawi",
          q: "qudsi",
        },
        collectionId = clean(req.params.collectionId, 30),
        book = books[collectionId],
        lang = language(req.query.language),
        meta = await getCollection().findOne({
          recordType: "collection",
          collectionId,
          published: { $ne: false },
        });
      if (!book && !meta)
        return res
          .status(404)
          .json({ message: "Hadith collection not found." });
      const managed = await getCollection()
        .find({
          recordType: { $ne: "collection" },
          collectionId,
          published: { $ne: false },
        })
        .sort({ book: 1, hadithNumber: 1 })
        .toArray();
      let external = [],
        collectionName = meta?.collectionName || book;
      if (collectionId === "m") {
        const response = await fetch(
          "https://cdn.jsdelivr.net/npm/sahih-muslim@1.1.2/data/muslim.json.gz",
        );
        if (!response.ok) throw Error("Sahih Muslim source is unavailable.");
        const data = JSON.parse(
          gunzipSync(Buffer.from(await response.arrayBuffer())).toString(
            "utf8",
          ),
        );
        const chapters = new Map(
          (data.chapters || []).map((chapter) => [
            String(chapter.id),
            chapter.english || chapter.arabic || "Sahih Muslim",
          ]),
        );
        external = (data.hadiths || [])
          .map((item) => {
            const no = String(item.id),
              narrator = clean(item.english?.narrator, 1000),
              body = clean(item.english?.text, 30000),
              text = [narrator, body].filter(Boolean).join(" ").trim();
            return {
              id: "source-m-" + no,
              cid: "m",
              no,
              title: "Hadith " + no,
              text,
              arabic: clean(item.arabic, 20000),
              by: narrator,
              book: String(item.chapterId || "1"),
              sectionName:
                chapters.get(String(item.chapterId)) || "Sahih Muslim",
              grade: "See source grading",
              reference: "Sahih Muslim " + no,
              source: "sahih-muslim 1.1.2",
              language: "en",
              hasTranslation: false,
            };
          })
          .filter((item) => item.text || item.arabic);
        collectionName = "Sahih Muslim";
      } else if (book) {
        const base =
          "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/";
        const [englishResponse, arabicResponse] = await Promise.all([
          fetch(base + "eng-" + book + ".min.json"),
          fetch(base + "ara-" + book + ".min.json").catch(() => null),
        ]);
        if (!englishResponse.ok) throw Error("Hadith source is unavailable.");
        const english = await englishResponse.json(),
          arabic =
            arabicResponse && arabicResponse.ok
              ? await arabicResponse.json()
              : null,
          arabicByNumber = new Map(
            (arabic?.hadiths || []).map((item) => [
              String(item.hadithnumber),
              item.text,
            ]),
          ),
          sections = english?.metadata?.section || {};
        collectionName = english?.metadata?.name || book;
        external = (english?.hadiths || []).map((item) => ({
          id: "source-" + collectionId + "-" + item.hadithnumber,
          cid: collectionId,
          no: String(item.hadithnumber),
          title: "Hadith " + item.hadithnumber,
          text: clean(item.text, 30000),
          arabic: clean(arabicByNumber.get(String(item.hadithnumber)), 20000),
          by: "",
          book: String(item.reference?.book || "1"),
          sectionName:
            sections[String(item.reference?.book || "1")] ||
            "Book " + String(item.reference?.book || "1"),
          grade:
            (item.grades || [])
              .map((row) => row.grade)
              .filter(Boolean)
              .join(", ") || "See source grading",
          reference: book + " " + item.hadithnumber,
          source: "fawazahmed0 Hadith API",
          language: "en",
          hasTranslation: false,
        }));
      }
      const managedRows = managed.map((row) => {
          const t = lang === "en" ? null : row.translations?.[lang];
          return {
            id: String(row._id),
            cid: row.collectionId,
            no: String(row.hadithNumber),
            title: t?.title || row.title || `Hadith ${row.hadithNumber}`,
            text: t?.text || row.text || "",
            arabic: row.arabic || "",
            pronunciation: t?.pronunciation || row.pronunciation || "",
            by: t?.narrator || row.narrator || "",
            book: row.book || "",
            sectionName: t?.sectionName || row.sectionName || "",
            grade: t?.grade || row.grade || "",
            explanation: t?.explanation || row.explanation || "",
            reference: t?.reference || row.reference || "",
            source: t?.source || row.source || "",
            language: t ? lang : "en",
            hasTranslation: Boolean(t),
          };
        }),
        managedByNumber = new Map(
          managedRows.map((item) => [String(item.no), item]),
        );
      const filled = external.map((source) => {
          const override = managedByNumber.get(String(source.no));
          if (!override) return source;
          managedByNumber.delete(String(source.no));
          return {
            ...source,
            ...override,
            title: override.title || source.title,
            text: override.text || source.text,
            arabic: override.arabic || source.arabic,
            by: override.by || source.by,
            book: override.book || source.book,
            sectionName: override.sectionName || source.sectionName,
            grade: override.grade || source.grade,
            reference: override.reference || source.reference,
            source: override.source || source.source,
          };
        }),
        data = [...filled, ...managedByNumber.values()];
      res.set(
        "Cache-Control",
        "public, max-age=300, stale-while-revalidate=3600",
      );
      res.json({
        collection: {
          id: collectionId,
          name: collectionName,
          total: data.length,
        },
        data,
      });
    } catch (e) {
      console.error(e);
      res
        .status(502)
        .json({ message: e.message || "Unable to load Hadith collection." });
    }
  });
  router.post("/api/hadith/explanation", (req, res) => {
    try {
      const text = clean(req.body?.text, 30000);
      if (text.length < 20)
        return res.status(400).json({ message: "Hadith text is required." });
      const match = findCommentary(text);
      res.set("Cache-Control", "public, max-age=86400");
      res.json({
        data: match
          ? {
              explanation: match.explanation || "",
              benefits: match.benefits || "",
              source: match.source || "HadeethEnc.com",
              language: "English",
            }
          : null,
      });
    } catch (e) {
      res.status(500).json({ message: "Unable to match Hadith explanation." });
    }
  });
  router.post("/api/admin/hadith/commentary-match", admin, (req, res) => {
    try {
      const match = findCommentary(req.body.text);
      res.json({
        data: match
          ? {
              explanation: match.explanation || "",
              benefits: match.benefits || "",
              source: match.source || "HadeethEnc.com",
              language: "English",
            }
          : null,
      });
    } catch (e) {
      res.status(500).json({ message: "Unable to match Hadith explanation." });
    }
  });
  router.get(
    "/api/admin/hadith/existing/:collectionId",
    admin,
    async (req, res) => {
      try {
        const books = {
            b: "bukhari",
            m: "muslim",
            a: "abudawud",
            t: "tirmidhi",
            s: "nasai",
            i: "ibnmajah",
            malik: "malik",
            n: "nawawi",
            q: "qudsi",
          },
          collectionId = clean(req.params.collectionId, 30),
          book = books[collectionId];
        if (!book)
          return res.status(400).json({ message: "Unknown collection." });
        const base =
            "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/",
          responses = await Promise.all([
            fetch(base + "eng-" + book + ".min.json"),
            fetch(base + "ara-" + book + ".min.json").catch(() => null),
          ]),
          er = responses[0],
          ar = responses[1];
        if (!er.ok) throw Error("Existing Hadith source unavailable.");
        const english = await er.json(),
          arabic = ar && ar.ok ? await ar.json() : null,
          arabicMap = new Map(
            (arabic?.hadiths || []).map((x) => [
              String(x.hadithnumber),
              x.text,
            ]),
          ),
          sections = english?.metadata?.section || {},
          rows = (english?.hadiths || []).map((x) => ({
            id: "existing-" + collectionId + "-" + x.hadithnumber,
            external: true,
            collectionId,
            collectionName: english?.metadata?.name || book,
            book: String(x.reference?.book || "1"),
            sectionName:
              sections[String(x.reference?.book || "1")] ||
              "Book " + String(x.reference?.book || "1"),
            hadithNumber: String(x.hadithnumber),
            title: "Hadith " + x.hadithnumber,
            arabic: String(arabicMap.get(String(x.hadithnumber)) || ""),
            text: clean(x.text, 30000),
            narrator: "",
            grade: (x.grades || [])
              .map((g) => g.grade)
              .filter(Boolean)
              .join(", "),
            explanation: "",
            reference: book + " " + x.hadithnumber,
            source: "fawazahmed0 Hadith API",
            published: true,
          }));
        res.json({ data: rows, total: rows.length });
      } catch (e) {
        console.error(e);
        res
          .status(502)
          .json({ message: e.message || "Unable to load existing Hadith." });
      }
    },
  );
  return router;
}
module.exports = { createHadithRouter };
