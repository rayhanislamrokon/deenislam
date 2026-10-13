require("dotenv").config();
const { MongoClient } = require("mongodb");

const TARGET_LANGUAGES = [
  "ay",
  "af",
  "as",
  "gu",
  "he",
  "hu",
  "ka",
  "kk",
  "km",
  "mr",
  "ne",
  "pa",
  "tl",
  "uk",
  "vi",
  "te",
  "jv",
  "om",
];
const MAX_BILLABLE_CHARACTERS = 13_500_000; // Hard ceiling: $270 at $20 / 1M, before any free credit.
const PRICE_PER_MILLION_USD = 20;
const decode = (value) =>
  String(value || "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

async function translateBatch(texts, target) {
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
      const results = (body?.data?.translations || []).map((item) =>
        decode(item.translatedText),
      );
      if (results.length !== texts.length)
        throw new Error(target + ": incomplete Google response");
      return results;
    }
    const message = String(body?.error?.message || response.status);
    if (!/rate limit|quota/i.test(message) || attempt === 7)
      throw new Error(target + ": " + message);
    const waitMs = Math.min(45000, 8000 * (attempt + 1));
    console.log(
      "\nRate limited; retrying " +
        target +
        " in " +
        Math.round(waitMs / 1000) +
        "s.",
    );
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
}

async function main() {
  if (!process.env.GOOGLE_TRANSLATE_API_KEY || !process.env.MONGODB_URI)
    throw new Error("Google Translation and MongoDB must be configured.");
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "deenislam");
  const surahs = db.collection("surahs");
  const jobs = db.collection("translation_jobs");
  const existingJob = await jobs.findOne(
    { name: "quran-google-budgeted" },
    { projection: { usedCharacters: 1 } },
  );
  let used = Number(existingJob?.usedCharacters) || 0;
  try {
    for (const language of TARGET_LANGUAGES) {
      const documents = await surahs
        .find({}, { projection: { number: 1, ayahs: 1 } })
        .sort({ number: 1 })
        .toArray();
      for (const surah of documents) {
        const missing = [];
        for (let index = 0; index < (surah.ayahs || []).length; index++) {
          const ayah = surah.ayahs[index];
          if (!ayah.translations?.[language])
            missing.push({
              index,
              source: String(ayah.translations?.en || ayah.translation || ""),
            });
        }
        for (let start = 0; start < missing.length; start += 100) {
          const batch = missing.slice(start, start + 100);
          const batchCharacters = batch.reduce(
            (sum, item) => sum + Math.max(1, [...item.source].length),
            0,
          );
          if (used + batchCharacters > MAX_BILLABLE_CHARACTERS) {
            await jobs.updateOne(
              { name: "quran-google-budgeted" },
              {
                $set: {
                  status: "budget-limit",
                  usedCharacters: used,
                  estimatedMaximumUsd:
                    (used / 1_000_000) * PRICE_PER_MILLION_USD,
                  stoppedAt: new Date(),
                  targetLanguages: TARGET_LANGUAGES,
                },
              },
              { upsert: true },
            );
            console.log(
              "\nBudget ceiling reached safely at " +
                used +
                " characters ($" +
                ((used / 1_000_000) * PRICE_PER_MILLION_USD).toFixed(2) +
                " maximum).",
            );
            return;
          }
          const translated = await translateBatch(
            batch.map((item) => item.source),
            language,
          );
          batch.forEach((item, offset) => {
            surah.ayahs[item.index].translations = {
              ...(surah.ayahs[item.index].translations || {}),
              [language]: translated[offset],
            };
          });
          used += batchCharacters;
        }
        if (missing.length)
          await surahs.updateOne(
            { number: surah.number },
            { $set: { ayahs: surah.ayahs, updatedAt: new Date() } },
          );
        await jobs.updateOne(
          { name: "quran-google-budgeted" },
          {
            $set: {
              status: "running",
              language,
              surah: surah.number,
              usedCharacters: used,
              estimatedMaximumUsd: (used / 1_000_000) * PRICE_PER_MILLION_USD,
              targetLanguages: TARGET_LANGUAGES,
              updatedAt: new Date(),
            },
          },
          { upsert: true },
        );
        process.stdout.write(language + ":" + surah.number + " ");
      }
    }
    await jobs.updateOne(
      { name: "quran-google-budgeted" },
      {
        $set: {
          status: "complete",
          usedCharacters: used,
          estimatedMaximumUsd: (used / 1_000_000) * PRICE_PER_MILLION_USD,
          completedAt: new Date(),
          targetLanguages: TARGET_LANGUAGES,
        },
      },
      { upsert: true },
    );
    console.log(
      "\nComplete: " +
        used +
        " characters, at most $" +
        ((used / 1_000_000) * PRICE_PER_MILLION_USD).toFixed(2) +
        ".",
    );
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error("\n" + error.message);
  process.exit(1);
});
