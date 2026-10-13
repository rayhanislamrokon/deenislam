const { MongoClient } = require("mongodb");
const { seedAmolContent } = require("./amol-seed");
require("dotenv").config();
async function run() {
  if (!process.env.MONGODB_URI) throw Error("MONGODB_URI is required.");
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || "deenislam");
    await seedAmolContent(db.collection("books"));
    const count = await db
      .collection("books")
      .countDocuments({ category: "Amol" });
    console.log("Amol content ready:", count);
  } finally {
    await client.close();
  }
}
run().catch((error) => {
  console.error(error);
  process.exit(1);
});
