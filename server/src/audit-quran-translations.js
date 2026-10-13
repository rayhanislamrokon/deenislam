require("dotenv").config();
const { MongoClient } = require("mongodb");
(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  try {
    const db = client.db(process.env.MONGODB_DB || "deenislam");
    const docs = await db
      .collection("surahs")
      .find({}, { projection: { ayahs: 1 } })
      .toArray();
    const counts = {};
    let total = 0;
    for (const surah of docs)
      for (const ayah of surah.ayahs || []) {
        total++;
        for (const code of Object.keys(ayah.translations || {}))
          counts[code] = (counts[code] || 0) + 1;
      }
    const complete = Object.entries(counts)
      .filter(([, n]) => n === total)
      .map(([code]) => code)
      .sort();
    const partial = Object.entries(counts)
      .filter(([, n]) => n !== total)
      .sort((a, b) => b[1] - a[1]);
    const job = await db
      .collection("translation_jobs")
      .findOne({ name: "quran-google-budgeted" }, { projection: { _id: 0 } });
    console.log(
      JSON.stringify(
        {
          surahs: docs.length,
          ayahs: total,
          completeLanguages: complete,
          completeCount: complete.length,
          partialLanguages: partial,
          job,
        },
        null,
        2,
      ),
    );
  } finally {
    await client.close();
  }
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
