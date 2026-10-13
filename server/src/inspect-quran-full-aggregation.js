require("dotenv").config();
const { MongoClient } = require("mongodb");
(async () => {
  const c = new MongoClient(process.env.MONGODB_URI);
  try {
    await c.connect();
    const col = c
        .db(process.env.MONGODB_DB || "deenislam")
        .collection("surahs"),
      stats = await col
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
          { $match: { number: 1 } },
        ])
        .toArray();
    console.log(JSON.stringify(stats, null, 2));
  } finally {
    await c.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
