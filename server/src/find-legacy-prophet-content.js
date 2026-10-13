require("dotenv").config();
const { MongoClient } = require("mongodb");

(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || "deenislam");
    const collections = await db
      .listCollections({}, { nameOnly: true })
      .toArray();
    const results = [];
    for (const { name } of collections) {
      const cursor = db
        .collection(name)
        .find({
          $or: [
            { name: /Idris/i },
            { title: /Idris/i },
            { slug: /idris/i },
            { "parts.title": /Truthful Prophet/i },
            { content: /Idris/i },
            { story: /Idris/i },
          ],
        })
        .limit(20);
      const docs = await cursor.toArray();
      if (docs.length) {
        results.push({
          collection: name,
          matches: docs.length,
          sizes: docs.map((doc) =>
            Buffer.byteLength(JSON.stringify(doc), "utf8"),
          ),
        });
      }
    }
    console.log(JSON.stringify(results, null, 2));
  } finally {
    await client.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
