const express = require("express");
const jwt = require("jsonwebtoken");
const clean = (value, max = 12000) =>
  String(value ?? "")
    .trim()
    .slice(0, max);
const lang = (value) => {
  const code = clean(value, 20).toLowerCase();
  return /^[a-z]{2,3}(?:-[a-z]{2,8})?$/.test(code) ? code : "en";
};

function createQuranAdminRouter(getSurahs, adminKey, jwtSecret) {
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
  router.get("/api/admin/quran/surahs", admin, async (_req, res) => {
    try {
      const collection = getSurahs(),
        rows = await collection
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
                revelationType: 1,
                localizedNames: 1,
              },
            },
          )
          .sort({ number: 1 })
          .toArray(),
        stats = await collection
          .aggregate([
            { $unwind: "$ayahs" },
            {
              $project: {
                number: 1,
                pairs: {
                  $objectToArray: { $ifNull: ["$ayahs.translations", {}] },
                },
              },
            },
            { $unwind: "$pairs" },
            {
              $match: {
                "pairs.k": { $ne: "en" },
                "pairs.v": { $type: "string", $ne: "" },
              },
            },
            {
              $group: {
                _id: { number: "$number", code: "$pairs.k" },
                count: { $sum: 1 },
              },
            },
            {
              $group: {
                _id: "$_id.number",
                entries: { $push: { k: "$_id.code", v: "$count" } },
              },
            },
            {
              $project: {
                _id: 0,
                number: "$_id",
                progress: { $arrayToObject: "$entries" },
              },
            },
          ])
          .toArray(),
        byNumber = new Map(stats.map((item) => [item.number, item.progress]));
      res.json({
        data: rows.map((row) => ({
          ...row,
          translationProgress: byNumber.get(row.number) || {},
        })),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Unable to load Quran content." });
    }
  });
  router.get("/api/admin/quran/surahs/:number", admin, async (req, res) => {
    try {
      const number = Number(req.params.number),
        row = await getSurahs().findOne({ number }, { projection: { _id: 0 } });
      if (!row) return res.status(404).json({ message: "Surah not found." });
      res.json({ data: row });
    } catch (error) {
      res.status(500).json({ message: "Unable to load this Surah." });
    }
  });
  router.put(
    "/api/admin/quran/surahs/:number/languages/:language",
    admin,
    async (req, res) => {
      try {
        const number = Number(req.params.number),
          language = lang(req.params.language);
        if (language === "en")
          return res
            .status(400)
            .json({ message: "English is protected base content." });
        const surah = await getSurahs().findOne({ number });
        if (!surah)
          return res.status(404).json({ message: "Surah not found." });
        const translations = Array.isArray(req.body.translations)
            ? req.body.translations
            : [],
          byAyah = new Map(
            translations.map((row) => [
              Number(row.numberInSurah),
              {
                text: clean(row.text, 12000),
                pronunciation: clean(row.pronunciation, 12000),
              },
            ]),
          );
        const ayahs = (surah.ayahs || []).map((ayah) => {
          const localized = byAyah.get(Number(ayah.numberInSurah));
          return localized === undefined
            ? ayah
            : {
                ...ayah,
                translations: {
                  ...(ayah.translations || {}),
                  [language]: localized.text,
                },
                pronunciations: {
                  ...(ayah.pronunciations || {}),
                  [language]: localized.pronunciation,
                },
              };
        });
        const pronunciation = clean(req.body.pronunciation, 300),
          meaning = clean(req.body.meaning, 600),
          source = clean(req.body.source, 500),
          reviewedBy = clean(req.body.reviewedBy, 300),
          now = new Date();
        await getSurahs().updateOne(
          { number },
          {
            $set: {
              ayahs,
              [`localizedNames.${language}`]: { pronunciation, meaning },
              [`translationMeta.${language}`]: {
                source,
                reviewedBy,
                updatedAt: now,
              },
              updatedAt: now,
            },
          },
        );
        res.json({
          message: `${language.toUpperCase()} Quran content saved.`,
          data: {
            number,
            language,
            saved: translations.filter((row) => clean(row.text)).length,
            total: ayahs.length,
          },
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Unable to save Quran translation." });
      }
    },
  );
  return router;
}
module.exports = { createQuranAdminRouter };
