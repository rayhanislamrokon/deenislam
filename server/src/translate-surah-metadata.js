require("dotenv").config();
const { MongoClient } = require("mongodb");
const QURAN_LANGUAGES = [
  "af",
  "am",
  "ar",
  "as",
  "ay",
  "az",
  "ba",
  "ber",
  "bg",
  "bn",
  "bs",
  "ce",
  "cs",
  "de",
  "dv",
  "en",
  "es",
  "fa",
  "fr",
  "gu",
  "ha",
  "he",
  "hi",
  "hu",
  "id",
  "it",
  "ja",
  "jv",
  "ka",
  "kk",
  "km",
  "ko",
  "ku",
  "ml",
  "mr",
  "ms",
  "my",
  "ne",
  "nl",
  "no",
  "om",
  "pa",
  "pl",
  "ps",
  "pt",
  "ro",
  "ru",
  "sd",
  "si",
  "so",
  "sq",
  "sv",
  "sw",
  "ta",
  "te",
  "tg",
  "th",
  "tl",
  "tr",
  "tt",
  "ug",
  "uk",
  "ur",
  "uz",
  "vi",
  "zh",
];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const decode = (value) =>
  String(value || "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
async function google(path, options = {}, attempt = 0) {
  const separator = path.includes("?") ? "&" : "?";
  const response = await fetch(
    "https://translation.googleapis.com/language/translate/v2" +
      path +
      separator +
      "key=" +
      encodeURIComponent(process.env.GOOGLE_TRANSLATE_API_KEY),
    options,
  );
  const data = await response.json();
  if (!response.ok) {
    if ((response.status === 429 || response.status >= 500) && attempt < 5) {
      await sleep(1000 * 2 ** attempt);
      return google(path, options, attempt + 1);
    }
    throw new Error(
      "Google Translation " +
        response.status +
        ": " +
        (data?.error?.message || "request failed"),
    );
  }
  return data;
}
async function translateMany(values, target) {
  if (target === "en") return values;
  const data = await google("", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: values, source: "en", target, format: "text" }),
  });
  const translated =
    data?.data?.translations?.map((item) => decode(item.translatedText)) || [];
  if (translated.length !== values.length)
    throw new Error(
      "Expected " +
        values.length +
        " " +
        target +
        " translations, received " +
        translated.length,
    );
  return translated;
}
async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");
  if (!process.env.GOOGLE_TRANSLATE_API_KEY)
    throw new Error("GOOGLE_TRANSLATE_API_KEY is required");
  const languageData = await google("/languages?target=en");
  const languages = (languageData?.data?.languages || [])
    .map((item) => ({ code: item.language, label: item.name }))
    .filter((item) => QURAN_LANGUAGES.includes(item.code));
  if (languages.length !== QURAN_LANGUAGES.length - 2)
    throw new Error(
      "Unexpected Google Quran language coverage: " + languages.length,
    );
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  try {
    const collection = client
      .db(process.env.MONGODB_DB || "deenislam")
      .collection("surahs");
    const surahs = await collection
      .find(
        {},
        {
          projection: {
            number: 1,
            englishName: 1,
            englishNameTranslation: 1,
            localizedNames: 1,
          },
        },
      )
      .sort({ number: 1 })
      .toArray();
    if (surahs.length !== 114)
      throw new Error("Expected 114 Surahs, received " + surahs.length);
    for (let index = 0; index < languages.length; index += 1) {
      const { code, label } = languages[index];
      const complete = surahs.every(
        (surah) =>
          surah.localizedNames?.[code]?.pronunciation &&
          surah.localizedNames?.[code]?.meaning,
      );
      if (complete) {
        console.log(
          "[" +
            (index + 1) +
            "/" +
            languages.length +
            "] " +
            label +
            " (" +
            code +
            ") already complete",
        );
        continue;
      }
      const pronunciations = await translateMany(
        surahs.map((surah) => surah.englishName || ""),
        code,
      );
      const meanings = await translateMany(
        surahs.map((surah) => surah.englishNameTranslation || ""),
        code,
      );
      await collection.bulkWrite(
        surahs.map((surah, surahIndex) => ({
          updateOne: {
            filter: { number: surah.number },
            update: {
              $set: {
                ["localizedNames." + code]: {
                  pronunciation: pronunciations[surahIndex],
                  meaning: meanings[surahIndex],
                },
                surahMetadataTranslationUpdatedAt: new Date(),
              },
            },
          },
        })),
        { ordered: false },
      );
      console.log(
        "[" +
          (index + 1) +
          "/" +
          languages.length +
          "] " +
          label +
          " (" +
          code +
          ") saved",
      );
      await sleep(80);
    }
    const translated = surahs.filter((surah) =>
      languages.every(
        ({ code }) =>
          surah.localizedNames?.[code]?.pronunciation &&
          surah.localizedNames?.[code]?.meaning,
      ),
    ).length;
    console.log(
      "Complete: " +
        translated +
        "/114 Surahs contain " +
        languages.length +
        " localized name records.",
    );
  } finally {
    await client.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
