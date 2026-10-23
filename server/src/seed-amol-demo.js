const { MongoClient } = require("mongodb");
require("dotenv").config();

const slug = "demo-morning-adhkar-routine";
const title = "Morning Adhkar Routine";
const reference = "Quran 33:41–42; authentic morning remembrance narrations";
const content = [
  "<h2>Begin the morning with remembrance</h2>",
  "<p>After Fajr, set aside a few calm minutes to remember Allah, renew your intention and prepare for the day with gratitude.</p>",
  "<h3>Simple daily routine</h3>",
  "<ul><li>Read authentic morning adhkar attentively.</li><li>Understand the meaning of each supplication.</li><li>Ask Allah for guidance, protection and beneficial work.</li><li>Keep the routine short enough to practise consistently.</li></ul>",
  "<blockquote data-tone=\"green\"><p>Consistency in a small beneficial deed is better than an ambitious routine that is quickly abandoned.</p></blockquote>",
].join("");

async function run() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required.");
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const books = client
      .db(process.env.MONGODB_DB || "deenislam")
      .collection("books");
    const now = new Date();
    const item = {
      slug,
      title,
      author: "DeenIslam Editorial",
      category: "Amol",
      language: "English",
      languageCode: "en",
      description:
        "A practical demo of a short, consistent morning remembrance routine.",
      license: "Original educational summary based on cited sources",
      sourceUrl: reference,
      coverImageUrl: "",
      coverImageKey: "",
      publicDomain: false,
      published: true,
      content,
      pages: [
        {
          number: 1,
          title: "Morning remembrance and preparation",
          reference,
          text: content,
          markdown: content,
          confidence: 100,
          needsReview: false,
        },
      ],
      extraction: {
        method: "editorial",
        pageCount: 1,
        averageConfidence: 100,
        needsReview: [],
      },
      updatedAt: now,
    };
    const result = await books.updateOne(
      { slug },
      { $set: item, $setOnInsert: { createdAt: now } },
      { upsert: true },
    );
    console.log(
      result.upsertedCount ? "Demo Amol created." : "Demo Amol refreshed.",
    );
  } finally {
    await client.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
