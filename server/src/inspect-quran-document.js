require("dotenv").config();
const { MongoClient } = require("mongodb");
(async () => {
  const c = new MongoClient(process.env.MONGODB_URI);
  try {
    await c.connect();
    const row = await c
      .db(process.env.MONGODB_DB || "deenislam")
      .collection("surahs")
      .findOne({ number: 1 });
    console.log(
      JSON.stringify(
        {
          ayahs: row?.ayahs?.length,
          firstTranslationKeys: Object.keys(
            row?.ayahs?.[0]?.translations || {},
          ),
          bengaliFilled: (row?.ayahs || []).filter((a) =>
            String(a.translations?.bn || "").trim(),
          ).length,
        },
        null,
        2,
      ),
    );
  } finally {
    await c.close();
  }
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
