const express = require("express");
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");
const { deleteReplacedImages, deleteStoredImages } = require("./s3-books");

const clean = (value, max = 50000) =>
  String(value ?? "")
    .trim()
    .slice(0, max);
const slugify = (value) =>
  clean(value, 140)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-");
const languageCode = (value) => {
  const code = clean(value, 20);
  return /^[a-z]{2,3}(?:-[A-Za-z]{2,8})?$/.test(code) ? code : "en";
};
const chapters = (body) =>
  (Array.isArray(body.chapters) ? body.chapters : [])
    .slice(0, 100)
    .map((chapter, index) => ({
      title: clean(chapter?.title, 250),
      content: clean(chapter?.content, 100000),
      about: clean(chapter?.about, 5000),
      reference: clean(chapter?.reference, 3000),
      order: index + 1,
    }))
    .filter((chapter) => chapter.title);
const localized = (body) => ({
  title: clean(body.title, 220),
  subtitle: clean(body.subtitle, 500),
  range: clean(body.range, 150),
  summary: clean(body.summary, 5000),
  chapters: chapters(body),
});
const publicItem = (item, requested = "en", adminView = false) => {
  const code = languageCode(requested),
    translation = code === "en" ? null : item.translations?.[code],
    copy = translation || item;
  return {
    id: item._id.toString(),
    slug: item.slug,
    order: item.order || 1,
    title: copy.title || item.title,
    subtitle: copy.subtitle || item.subtitle || "",
    range: copy.range || item.range || "",
    summary: copy.summary || item.summary || "",
    chapters: copy.chapters?.length ? copy.chapters : item.chapters || [],
    published: item.published !== false,
    requestedLanguage: code,
    language: translation ? code : "en",
    hasTranslation: Boolean(translation),
    availableLanguages: ["en", ...Object.keys(item.translations || {})],
    ...(adminView ? { translations: item.translations || {} } : {}),
  };
};

function createIslamicHistoryRouter(getCollection, adminKey, jwtSecret) {
  const router = express.Router();
  const admin = (req, res, next) => {
    if (adminKey && req.get("x-admin-key") === adminKey) return next();
    try {
      const token = clean(req.get("authorization"), 500).replace(
          /^Bearer\s+/i,
          "",
        ),
        payload = jwt.verify(token, jwtSecret);
      if (!["admin", "super_admin", "moderator"].includes(payload.role))
        throw Error("role");
      next();
    } catch {
      return res
        .status(401)
        .json({ message: "Admin session is invalid or expired." });
    }
  };
  router.get("/api/islamic-history", async (req, res) => {
    try {
      const language = languageCode(req.query.language),
        items = await getCollection()
          .find({ published: { $ne: false } })
          .sort({ order: 1, title: 1 })
          .toArray();
      res.set("Cache-Control", "no-store, max-age=0");
      res.json({ data: items.map((item) => publicItem(item, language)) });
    } catch (error) {
      console.error("Islamic History public error", error);
      res
        .status(500)
        .json({ message: "Unable to load Islamic History content." });
    }
  });
  router.get("/api/admin/islamic-history", admin, async (_req, res) => {
    try {
      const items = await getCollection()
        .find({})
        .sort({ order: 1, title: 1 })
        .toArray();
      res.json({ data: items.map((item) => publicItem(item, "en", true)) });
    } catch {
      return res
        .status(500)
        .json({ message: "Unable to load Islamic History content." });
    }
  });
  router.post("/api/admin/islamic-history", admin, async (req, res) => {
    try {
      if (languageCode(req.body.language) !== "en")
        return res.status(400).json({
          message: "Create the English base first, then add translations.",
        });
      const content = localized(req.body);
      if (content.title.length < 3)
        return res
          .status(400)
          .json({ message: "Historical period title is required." });
      let slug = slugify(req.body.slug || content.title) || "history-period";
      if (await getCollection().findOne({ slug })) slug += "-" + Date.now();
      const now = new Date(),
        doc = {
          ...content,
          slug,
          order: Math.max(1, Math.min(999, Number(req.body.order) || 1)),
          published: req.body.published !== false,
          translations: {},
          createdAt: now,
          updatedAt: now,
        },
        result = await getCollection().insertOne(doc);
      res.status(201).json({
        data: publicItem({ ...doc, _id: result.insertedId }, "en", true),
      });
    } catch {
      return res
        .status(500)
        .json({ message: "Unable to create historical period." });
    }
  });
  router.put("/api/admin/islamic-history/:id", admin, async (req, res) => {
    try {
      if (!ObjectId.isValid(req.params.id))
        return res.status(400).json({ message: "Invalid period ID." });
      const existing = await getCollection().findOne({
          _id: new ObjectId(req.params.id),
        });
      if (!existing)
        return res
          .status(404)
          .json({ message: "Historical period not found." });
      const language = languageCode(req.body.language),
        set =
          language === "en"
            ? {
                ...localized(req.body),
                order: Math.max(1, Math.min(999, Number(req.body.order) || 1)),
                published: req.body.published !== false,
                updatedAt: new Date(),
              }
            : {
                ["translations." + language]: localized(req.body),
                updatedAt: new Date(),
              },
        item = await getCollection().findOneAndUpdate(
          { _id: new ObjectId(req.params.id) },
          { $set: set },
          { returnDocument: "after" },
        );
      if (!item)
        return res
          .status(404)
          .json({ message: "Historical period not found." });
      await deleteReplacedImages(existing, item);
      res.json({ data: publicItem(item, "en", true) });
    } catch {
      return res
        .status(500)
        .json({ message: "Unable to update historical period." });
    }
  });
  router.delete("/api/admin/islamic-history/:id", admin, async (req, res) => {
    if (!ObjectId.isValid(req.params.id))
      return res.status(400).json({ message: "Invalid period ID." });
    const id = new ObjectId(req.params.id);
    const item = await getCollection().findOne({ _id: id });
    if (!item)
      return res.status(404).json({ message: "Historical period not found." });
    await deleteStoredImages(item);
    await getCollection().deleteOne({ _id: id });
    res.json({ message: "Historical period deleted." });
  });
  return router;
}
module.exports = { createIslamicHistoryRouter };
