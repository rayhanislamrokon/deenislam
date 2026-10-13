const express = require("express");
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");

const clean = (value, max = 1000) =>
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
const localized = (body) => ({
  name: clean(body.name, 180),
  arabic: clean(body.arabic, 300),
  summary: clean(body.summary, 3000),
  parts: Array.isArray(body.parts)
    ? body.parts
        .slice(0, 80)
        .map((part, index) => ({
          title: clean(part?.title, 250),
          story: clean(part?.story, 50000),
          reference: clean(part?.reference, 1500),
          order: index + 1,
        }))
        .filter((part) => part.title || part.story || part.reference)
    : [],
});
const publicItem = (item, requested = "en", adminView = false) => {
  const code = languageCode(requested),
    translation = code === "en" ? null : item.translations?.[code],
    copy = translation || item;
  return {
    id: item._id.toString(),
    slug: item.slug,
    order: item.order || 1,
    name: copy.name || item.name,
    arabic: copy.arabic || item.arabic || "",
    summary: copy.summary || item.summary || "",
    parts: copy.parts?.length ? copy.parts : item.parts || [],
    published: item.published !== false,
    requestedLanguage: code,
    language: translation ? code : "en",
    hasTranslation: Boolean(translation),
    availableLanguages: ["en", ...Object.keys(item.translations || {})],
    ...(adminView ? { translations: item.translations || {} } : {}),
  };
};

function createProphetsRouter(getCollection, adminKey, jwtSecret) {
  const router = express.Router();
  const admin = (req, res, next) => {
    if (adminKey && req.get("x-admin-key") === adminKey) return next();
    try {
      const token = clean(req.get("authorization"), 500).replace(
          /^Bearer\s+/i,
          "",
        ),
        payload = jwt.verify(token, jwtSecret);
      if (payload.role !== "admin") throw Error("role");
      next();
    } catch {
      return res
        .status(401)
        .json({ message: "Admin session is invalid or expired." });
    }
  };
  router.get("/api/prophets", async (req, res) => {
    try {
      const language = languageCode(req.query.language),
        items = await getCollection()
          .find({ published: { $ne: false } })
          .sort({ order: 1, name: 1 })
          .toArray();
      res.set("Cache-Control", "no-store, max-age=0");
      res.json({ data: items.map((item) => publicItem(item, language)) });
    } catch (error) {
      console.error("Prophets public error", error);
      res.status(500).json({ message: "Unable to load Prophets content." });
    }
  });
  router.get("/api/admin/prophets", admin, async (_req, res) => {
    try {
      const items = await getCollection()
        .find({})
        .sort({ order: 1, name: 1 })
        .toArray();
      res.json({ data: items.map((item) => publicItem(item, "en", true)) });
    } catch (error) {
      res.status(500).json({ message: "Unable to load Prophets content." });
    }
  });
  router.post("/api/admin/prophets", admin, async (req, res) => {
    try {
      if (languageCode(req.body.language) !== "en")
        return res.status(400).json({
          message: "Create the English base first, then add translations.",
        });
      const content = localized(req.body);
      if (content.name.length < 2)
        return res.status(400).json({ message: "Prophet name is required." });
      let slug = slugify(req.body.slug || content.name) || "prophet";
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
    } catch (error) {
      res.status(500).json({ message: "Unable to create Prophet content." });
    }
  });
  router.put("/api/admin/prophets/:id", admin, async (req, res) => {
    try {
      if (!ObjectId.isValid(req.params.id))
        return res.status(400).json({ message: "Invalid Prophet ID." });
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
      if (!item) return res.status(404).json({ message: "Prophet not found." });
      res.json({ data: publicItem(item, "en", true) });
    } catch (error) {
      res.status(500).json({ message: "Unable to update Prophet content." });
    }
  });
  router.delete("/api/admin/prophets/:id", admin, async (req, res) => {
    if (!ObjectId.isValid(req.params.id))
      return res.status(400).json({ message: "Invalid Prophet ID." });
    const result = await getCollection().deleteOne({
      _id: new ObjectId(req.params.id),
    });
    if (!result.deletedCount)
      return res.status(404).json({ message: "Prophet not found." });
    res.json({ message: "Prophet content deleted." });
  });
  return router;
}
module.exports = { createProphetsRouter };
