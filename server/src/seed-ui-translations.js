require("dotenv").config();
const { MongoClient } = require("mongodb");
const { readFile, writeFile } = require("fs/promises");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const UI_FILE = path.join(ROOT, "src", "data", "uiTranslations.json");
const PROTECTED = new Set([
  "Quran",
  "Hadith",
  "Qibla",
  "Tafsir",
  "Zakat",
  "Aqidah",
  "Seerah",
  "Tasbih",
  "Surah Al-Kahf",
  "Fajr",
  "Dhuhr",
  "Asr",
  "Maghrib",
  "Isha",
  "AI",
]);
const decode = (value) =>
  String(value || "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

async function googleTranslate(texts, target) {
  const response = await fetch(
    "https://translation.googleapis.com/language/translate/v2?key=" +
      encodeURIComponent(process.env.GOOGLE_TRANSLATE_API_KEY),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: texts, source: "en", target, format: "text" }),
    },
  );
  const body = await response.json();
  if (!response.ok)
    throw new Error(target + ": " + (body?.error?.message || response.status));
  return (body?.data?.translations || []).map((item) =>
    decode(item.translatedText),
  );
}

async function main() {
  if (!process.env.GOOGLE_TRANSLATE_API_KEY || !process.env.MONGODB_URI)
    throw new Error("Google Translation and MongoDB must be configured.");
  const packs = JSON.parse(await readFile(UI_FILE, "utf8"));
  Object.assign(packs.en, {
    Recitation: "Recitation",
    Pronunciation: "Pronunciation",
    Meaning: "Meaning",
  });
  const phrases = Object.keys(packs.en);
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const collection = client
    .db(process.env.MONGODB_DB || "deenislam")
    .collection("ui_translations");
  await collection.createIndex({ language: 1 }, { unique: true });
  try {
    for (const language of Object.keys(packs)) {
      if (language !== "en") {
        const translatable = phrases.filter(
          (phrase) => !PROTECTED.has(phrase) && !packs[language][phrase],
        );
        const translated = [];
        for (let start = 0; start < translatable.length; start += 100)
          translated.push(
            ...(await googleTranslate(
              translatable.slice(start, start + 100),
              language,
            )),
          );
        translatable.forEach((phrase, index) => {
          packs[language][phrase] =
            translated[index] || packs[language][phrase] || phrase;
        });
        PROTECTED.forEach((phrase) => {
          if (!phrases.includes(phrase)) return;
          const current = packs[language][phrase] || phrase;
          packs[language][phrase] =
            current.toLowerCase().includes(phrase.toLowerCase()) &&
            current.length > phrase.length + 3
              ? phrase
              : current;
        });
      }
      await collection.updateOne(
        { language },
        {
          $set: {
            language,
            strings: packs[language],
            provider:
              language === "en" ? "source" : "google-cloud-translation-v2",
            updatedAt: new Date(),
          },
        },
        { upsert: true },
      );
      process.stdout.write(language + " ");
    }
    await writeFile(UI_FILE, JSON.stringify(packs, null, 2), "utf8");
    console.log(
      "\nSaved " +
        Object.keys(packs).length +
        " language packs to MongoDB and the offline app bundle.",
    );
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
