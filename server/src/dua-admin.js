const express = require("express");
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");
const clean = (v, n = 30000) =>
  String(v ?? "")
    .trim()
    .slice(0, n);
const lang = (v) => {
  const x = clean(v, 20).toLowerCase();
  return /^[a-z]{2,3}(?:-[a-z]{2,8})?$/.test(x) ? x : "en";
};
function createDuaRouter(getCollection, adminKey, jwtSecret) {
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
    key: clean(b.key, 180),
    name: clean(b.name, 500),
    description: clean(b.description, 1200),
    arabic: clean(b.arabic),
    pronunciation: clean(b.pronunciation),
    meaning: clean(b.meaning),
    source: clean(b.source, 1500),
    category: clean(b.category, 200) || "General",
    order: Math.max(1, Number(b.order) || 1),
    published: b.published !== false,
  });
  router.get("/api/admin/duas", admin, async (req, res) => {
    try {
      const rows = await getCollection()
        .find({})
        .sort({ order: 1, name: 1 })
        .toArray();
      res.json({
        data: rows.map((x) => ({ ...x, id: String(x._id), _id: undefined })),
      });
    } catch (e) {
      res.status(500).json({ message: "Unable to load Duas." });
    }
  });
  router.post("/api/admin/duas", admin, async (req, res) => {
    try {
      if (lang(req.body.language) !== "en")
        return res
          .status(400)
          .json({ message: "Create or import the English Dua first." });
      const row = {
        ...fields(req.body),
        translations: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      if (!row.key) row.key = "admin-" + Date.now();
      if (!row.name || !row.arabic || !row.meaning)
        return res
          .status(400)
          .json({ message: "Name, Arabic text and meaning are required." });
      const result = await getCollection().insertOne(row);
      res.status(201).json({
        message: "Dua saved.",
        data: { ...row, id: String(result.insertedId) },
      });
    } catch (e) {
      if (e?.code === 11000)
        return res
          .status(409)
          .json({ message: "This Dua has already been imported." });
      res.status(500).json({ message: "Unable to save Dua." });
    }
  });
  router.put("/api/admin/duas/:id", admin, async (req, res) => {
    try {
      if (!ObjectId.isValid(req.params.id))
        return res.status(400).json({ message: "Invalid Dua id." });
      const id = new ObjectId(req.params.id),
        language = lang(req.body.language),
        current = await getCollection().findOne({ _id: id });
      if (!current) return res.status(404).json({ message: "Dua not found." });
      if (language === "en")
        await getCollection().updateOne(
          { _id: id },
          { $set: { ...fields(req.body), updatedAt: new Date() } },
        );
      else
        await getCollection().updateOne(
          { _id: id },
          {
            $set: {
              [`translations.${language}`]: fields({ ...current, ...req.body }),
              updatedAt: new Date(),
            },
          },
        );
      res.json({
        message:
          language === "en"
            ? "Dua updated."
            : `${language.toUpperCase()} translation saved.`,
      });
    } catch (e) {
      res.status(500).json({ message: "Unable to update Dua." });
    }
  });
  router.delete("/api/admin/duas/:id", admin, async (req, res) => {
    try {
      if (!ObjectId.isValid(req.params.id))
        return res.status(400).json({ message: "Invalid Dua id." });
      await getCollection().deleteOne({ _id: new ObjectId(req.params.id) });
      res.json({ message: "Dua deleted." });
    } catch (e) {
      res.status(500).json({ message: "Unable to delete Dua." });
    }
  });
  router.get("/api/duas/admin-content", async (req, res) => {
    try {
      const language = lang(req.query.language),
        rows = await getCollection()
          .find({ published: { $ne: false } })
          .sort({ order: 1, name: 1 })
          .toArray();
      res.json({
        data: rows.map((row) => {
          const t = language === "en" ? null : row.translations?.[language];
          return {
            id: String(row._id),
            key: row.key,
            name: t?.name || row.name,
            description: t?.description || row.description || "",
            arabic: row.arabic,
            pronunciation: t?.pronunciation || row.pronunciation,
            meaning: t?.meaning || row.meaning,
            source: t?.source || row.source,
            category: t?.category || row.category,
            order: row.order,
            language: t ? language : "en",
            hasTranslation: Boolean(t),
          };
        }),
      });
    } catch (e) {
      res.status(500).json({ message: "Unable to load Duas." });
    }
  });
  return router;
}
module.exports = { createDuaRouter };
