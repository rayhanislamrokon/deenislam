const { MongoClient } = require("mongodb");
require("dotenv").config();
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGODB_URI is required in server/.env");
async function getEdition(edition) {
  const response = await fetch(`https://api.alquran.cloud/v1/quran/${edition}`);
  if (!response.ok)
    throw new Error(`Quran API request failed (${response.status})`);
  const body = await response.json();
  if (body.code !== 200 || !Array.isArray(body.data?.surahs))
    throw new Error("Quran API returned invalid data");
  return body.data.surahs;
}
async function seed() {
  const [arabicSurahs, englishSurahs, bengaliSurahs, transliterationSurahs] =
    await Promise.all([
      getEdition("quran-uthmani"),
      getEdition("en.sahih"),
      getEdition("bn.bengali"),
      getEdition("en.transliteration"),
    ]);
  if (
    arabicSurahs.length !== 114 ||
    englishSurahs.length !== 114 ||
    transliterationSurahs.length !== 114
  )
    throw new Error("Expected exactly 114 Surahs");
  const documents = arabicSurahs.map((surah, surahIndex) => {
    const translation = englishSurahs[surahIndex];
    const transliteration = transliterationSurahs[surahIndex];
    return {
      number: surah.number,
      name: surah.name,
      englishName: surah.englishName,
      englishNameTranslation: surah.englishNameTranslation,
      revelationType: surah.revelationType,
      numberOfAyahs: surah.ayahs.length,
      ayahs: surah.ayahs.map((ayah, ayahIndex) => ({
        number: ayah.number,
        numberInSurah: ayah.numberInSurah,
        juz: ayah.juz,
        page: ayah.page,
        text: ayah.text,
        transliteration: transliteration.ayahs[ayahIndex]?.text || "",
        translation: translation.ayahs[ayahIndex]?.text || "",
        translations: {
          en: translation.ayahs[ayahIndex]?.text || "",
          bn: bengaliSurahs[surahIndex]?.ayahs[ayahIndex]?.text || "",
        },
      })),
      source:
        "Al Quran Cloud: quran-uthmani + en.transliteration + en.sahih + bn.bengali",
      updatedAt: new Date(),
    };
  });
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const collection = client
      .db(process.env.MONGODB_DB || "deenislam")
      .collection("surahs");
    await collection.createIndex({ number: 1 }, { unique: true });
    const operations = documents.map((document) => ({
      updateOne: {
        filter: { number: document.number },
        update: { $set: document },
        upsert: true,
      },
    }));
    const result = await collection.bulkWrite(operations);
    const count = await collection.countDocuments();
    console.log(
      `Quran seed complete: ${count} Surahs, ${documents.reduce((sum, item) => sum + item.numberOfAyahs, 0)} Ayahs (${result.upsertedCount} inserted, ${result.modifiedCount} updated).`,
    );
  } finally {
    await client.close();
  }
}
seed().catch((error) => {
  console.error("Quran seed failed:", error);
  process.exit(1);
});
