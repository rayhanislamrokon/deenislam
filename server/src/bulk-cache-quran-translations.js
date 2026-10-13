require("dotenv").config();
const { MongoClient } = require("mongodb");

const MAX_GOOGLE_CHARACTERS = Number(
  process.env.QURAN_TRANSLATION_MAX_CHARACTERS || 14000000,
);
const PRIORITY = [
  "bn",
  "ur",
  "hi",
  "id",
  "ms",
  "tr",
  "fa",
  "fr",
  "es",
  "de",
  "ru",
  "zh",
  "pt",
  "sw",
  "ha",
  "ta",
  "te",
  "ml",
  "th",
  "vi",
];
const decode = (value) =>
  String(value || "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function json(url, options) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(url, options);
    const body = await response.json().catch(() => ({}));
    if (response.ok) return body;
    if (response.status !== 429 && response.status < 500)
      throw new Error(body?.error?.message || String(response.status));
    await sleep(1000 * (attempt + 1));
  }
  throw new Error("Request failed after retries.");
}

async function saveLanguage(
  surahs,
  collection,
  language,
  translatedSurahs,
  provider,
) {
  const operations = surahs.map((surah, index) => {
    const remote = translatedSurahs[index];
    const ayahs = surah.ayahs.map((ayah, ayahIndex) => ({
      ...ayah,
      translations: {
        ...(ayah.translations || {}),
        [language]:
          remote.ayahs[ayahIndex] ||
          ayah.translations?.en ||
          ayah.translation ||
          "",
      },
    }));
    surah.ayahs = ayahs;
    return {
      updateOne: {
        filter: { number: surah.number },
        update: {
          $set: {
            ayahs,
            [`translationProviders.${language}`]: provider,
            updatedAt: new Date(),
          },
        },
      },
    };
  });
  await collection.bulkWrite(operations, { ordered: true });
}

async function googleLanguage(surahs, language) {
  const result = [];
  for (const surah of surahs) {
    const source = surah.ayahs.map(
      (ayah) => ayah.translations?.en || ayah.translation || "",
    );
    const translated = [];
    for (let start = 0; start < source.length; start += 100) {
      const body = await json(
        "https://translation.googleapis.com/language/translate/v2?key=" +
          encodeURIComponent(process.env.GOOGLE_TRANSLATE_API_KEY),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            q: source.slice(start, start + 100),
            source: "en",
            target: language,
            format: "text",
          }),
        },
      );
      translated.push(
        ...body.data.translations.map((item) => decode(item.translatedText)),
      );
    }
    result.push({ ayahs: translated });
  }
  return result;
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required.");
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const collection = client
    .db(process.env.MONGODB_DB || "deenislam")
    .collection("surahs");
  const surahs = await collection
    .find({}, { projection: { _id: 0 } })
    .sort({ number: 1 })
    .toArray();
  const editionsBody = await json(
    "https://api.alquran.cloud/v1/edition/type/translation",
  );
  const editionByLanguage = new Map();
  for (const edition of editionsBody.data || [])
    if (edition.format === "text" && !editionByLanguage.has(edition.language))
      editionByLanguage.set(edition.language, edition.identifier);
  for (const [language, identifier] of editionByLanguage) {
    if (language === "en") continue;
    if (
      surahs.every((surah) =>
        surah.ayahs.every((ayah) => ayah.translations?.[language]),
      )
    )
      continue;
    const remote = await json(
      "https://api.alquran.cloud/v1/quran/" + encodeURIComponent(identifier),
    );
    await saveLanguage(
      surahs,
      collection,
      language,
      remote.data.surahs.map((item) => ({
        ayahs: item.ayahs.map((ayah) => ayah.text),
      })),
      "alquran.cloud:" + identifier,
    );
    console.log("FREE", language, identifier);
  }
  let used = 0;
  const charsPerLanguage = surahs.reduce(
    (total, surah) =>
      total +
      surah.ayahs.reduce(
        (sum, ayah) =>
          sum + String(ayah.translations?.en || ayah.translation || "").length,
        0,
      ),
    0,
  );
  for (const language of PRIORITY) {
    if (
      surahs.every((surah) =>
        surah.ayahs.every((ayah) => ayah.translations?.[language]),
      )
    )
      continue;
    if (used + charsPerLanguage > MAX_GOOGLE_CHARACTERS) break;
    await saveLanguage(
      surahs,
      collection,
      language,
      await googleLanguage(surahs, language),
      "google-cloud-translation-v2",
    );
    used += charsPerLanguage;
    console.log(
      "GOOGLE",
      language,
      "characters=" + used + "/" + MAX_GOOGLE_CHARACTERS,
    );
  }
  const fresh = await collection
    .find({}, { projection: { ayahs: 1 } })
    .toArray();
  const complete = new Set();
  for (const language of [...editionByLanguage.keys(), ...PRIORITY])
    if (
      fresh.every((surah) =>
        surah.ayahs.every((ayah) => ayah.translations?.[language]),
      )
    )
      complete.add(language);
  console.log("COMPLETE_LANGUAGES", [...complete].sort().join(","));
  console.log("GOOGLE_CHARACTERS", used, "MAX", MAX_GOOGLE_CHARACTERS);
  await client.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
