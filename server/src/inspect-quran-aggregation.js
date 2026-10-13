require("dotenv").config();
const { MongoClient } = require("mongodb");
(async () => {
  const c = new MongoClient(process.env.MONGODB_URI);
  try {
    await c.connect();
    const col = c
        .db(process.env.MONGODB_DB || "deenislam")
        .collection("surahs"),
      rows = await col
        .aggregate([
          { $match: { number: 1 } },
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
          { $match: { "pairs.k": "bn" } },
          { $limit: 3 },
        ])
        .toArray();
    console.log(
      JSON.stringify(
        rows.map((x) => ({
          number: x.number,
          key: x.pairs?.k,
          hasValue: Boolean(String(x.pairs?.v || "").trim()),
        })),
        null,
        2,
      ),
    );
  } finally {
    await c.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
