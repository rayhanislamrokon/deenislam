require("dotenv").config();
const { MongoClient } = require("mongodb");
const TARGET_LANGUAGES = [
  "bho",
  "bik",
  "br",
  "bua",
  "yue",
  "ca",
  "ceb",
  "ny",
  "zh-TW",
  "cv",
  "co",
  "crh",
  "hr",
  "da",
  "din",
];
const JOB_NAME = "quran-google-next15-batch2-2026-09-12";
const MAX_CHARACTERS = 14_000_000;
const decode = (v) =>
  String(v || "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
async function translate(texts, target) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const response = await fetch(
      "https://translation.googleapis.com/language/translate/v2?key=" +
        encodeURIComponent(process.env.GOOGLE_TRANSLATE_API_KEY),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: texts,
          source: "en",
          target,
          format: "text",
        }),
      },
    );
    const body = await response.json();
    if (response.ok) {
      const rows = (body?.data?.translations || []).map((x) =>
        decode(x.translatedText),
      );
      if (rows.length !== texts.length)
        throw Error(target + ": incomplete response");
      return rows;
    }
    const message = String(body?.error?.message || response.status);
    if (!/rate|quota|backend|internal/i.test(message) || attempt === 7)
      throw Error(target + ": " + message);
    await new Promise((r) =>
      setTimeout(r, Math.min(45000, 8000 * (attempt + 1))),
    );
  }
  throw Error(target + ": retries exhausted");
}
async function main() {
  if (!process.env.GOOGLE_TRANSLATE_API_KEY || !process.env.MONGODB_URI)
    throw Error("Google Translation and MongoDB configuration is required.");
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "deenislam"),
    surahs = db.collection("surahs"),
    jobs = db.collection("translation_jobs");
  const old = await jobs.findOne({ name: JOB_NAME });
  let used = Number(old?.usedCharacters) || 0;
  try {
    for (const language of TARGET_LANGUAGES) {
      const docs = await surahs
        .find({}, { projection: { number: 1, ayahs: 1 } })
        .sort({ number: 1 })
        .toArray();
      for (const surah of docs) {
        const missing = [];
        for (let i = 0; i < (surah.ayahs || []).length; i++) {
          const ayah = surah.ayahs[i];
          if (!ayah.translations?.[language])
            missing.push({
              index: i,
              source: String(ayah.translations?.en || ayah.translation || ""),
            });
        }
        for (let start = 0; start < missing.length; start += 100) {
          const batch = missing.slice(start, start + 100),
            chars = batch.reduce(
              (n, x) => n + Math.max(1, [...x.source].length),
              0,
            );
          if (used + chars > MAX_CHARACTERS)
            throw Error(
              "New 15-language safety ceiling reached at " +
                used +
                " characters.",
            );
          const translated = await translate(
            batch.map((x) => x.source),
            language,
          );
          batch.forEach((x, j) => {
            surah.ayahs[x.index].translations = {
              ...(surah.ayahs[x.index].translations || {}),
              [language]: translated[j],
            };
          });
          used += chars;
        }
        if (missing.length)
          await surahs.updateOne(
            { number: surah.number },
            { $set: { ayahs: surah.ayahs, updatedAt: new Date() } },
          );
        await jobs.updateOne(
          { name: JOB_NAME },
          {
            $set: {
              status: "running",
              language,
              surah: surah.number,
              usedCharacters: used,
              estimatedUsd: (used / 1e6) * 20,
              targetLanguages: TARGET_LANGUAGES,
              updatedAt: new Date(),
            },
          },
          { upsert: true },
        );
        process.stdout.write(language + ":" + surah.number + " ");
      }
      console.log("\nLANGUAGE_COMPLETE " + language);
    }
    await jobs.updateOne(
      { name: JOB_NAME },
      {
        $set: {
          status: "complete",
          usedCharacters: used,
          estimatedUsd: (used / 1e6) * 20,
          targetLanguages: TARGET_LANGUAGES,
          completedAt: new Date(),
        },
      },
      { upsert: true },
    );
    console.log(
      "COMPLETE characters=" +
        used +
        " estimatedUsd=" +
        ((used / 1e6) * 20).toFixed(2),
    );
  } catch (error) {
    await jobs.updateOne(
      { name: JOB_NAME },
      {
        $set: {
          status: "failed",
          error: error.message,
          usedCharacters: used,
          estimatedUsd: (used / 1e6) * 20,
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );
    throw error;
  } finally {
    await client.close();
  }
}
main().catch((e) => {
  console.error("\n" + e.message);
  process.exit(1);
});
