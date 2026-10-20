require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const { MongoClient } = require("mongodb");

const slug = "daily-adab-pdf-demo";

const parts = [
  {
    number: 1,
    title: "Part One — Beginning the Day",
    reference: "Original DeenIslam demo content",
    pages: [
      {
        number: 1,
        originalPage: 1,
        text: "Begin with intention\n\nA good day begins with a sincere intention. Remember Allah, be grateful for waking, and decide that your words and actions will benefit others.\n\nStart calmly, keep the morning prayer at the centre of the routine, and plan the day around what is beneficial.",
        markdown: "# Begin with intention\n\nA good day begins with a sincere intention. Remember Allah, be grateful for waking, and decide that your words and actions will benefit others.\n\nStart calmly, keep the morning prayer at the centre of the routine, and plan the day around what is beneficial.",
        confidence: 100,
        needsReview: false,
      },
      {
        number: 2,
        originalPage: 2,
        text: "Cleanliness and preparation\n\nPersonal cleanliness, tidy clothing, and an orderly space help a Muslim approach worship and daily responsibilities with care.\n\nPrepare what you need before leaving home and avoid wasting water, food, time, or other blessings.",
        markdown: "# Cleanliness and preparation\n\nPersonal cleanliness, tidy clothing, and an orderly space help a Muslim approach worship and daily responsibilities with care.\n\nPrepare what you need before leaving home and avoid wasting water, food, time, or other blessings.",
        confidence: 100,
        needsReview: false,
      },
    ],
  },
  {
    number: 2,
    title: "Part Two — Character with People",
    reference: "Original DeenIslam demo content",
    pages: [
      {
        number: 1,
        originalPage: 3,
        text: "Speaking with kindness\n\nSpeak truthfully and gently. Listen before replying, avoid mockery and gossip, and choose silence when words would cause harm.\n\nA sincere greeting, a patient answer, and a word of encouragement are simple ways to improve a community.",
        markdown: "# Speaking with kindness\n\nSpeak truthfully and gently. Listen before replying, avoid mockery and gossip, and choose silence when words would cause harm.\n\nA sincere greeting, a patient answer, and a word of encouragement are simple ways to improve a community.",
        confidence: 100,
        needsReview: false,
      },
      {
        number: 2,
        originalPage: 4,
        text: "Ending the day well\n\nReview the day with honesty. Be thankful for what went well, seek forgiveness for mistakes, and make a practical intention to improve tomorrow.\n\nReturn trusts, settle responsibilities, forgive others, and finish with remembrance and hope in Allah.",
        markdown: "# Ending the day well\n\nReview the day with honesty. Be thankful for what went well, seek forgiveness for mistakes, and make a practical intention to improve tomorrow.\n\nReturn trusts, settle responsibilities, forgive others, and finish with remembrance and hope in Allah.",
        confidence: 100,
        needsReview: false,
      },
    ],
  },
];

const content = parts
  .flatMap((part) => part.pages.map((page) => page.markdown))
  .join("\n\n");

async function run() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is missing.");
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const books = client
      .db(process.env.MONGODB_DB || "deenislam")
      .collection("books");
    const now = new Date();
    await books.updateOne(
      { slug },
      {
        $set: {
          title: "A Beginner's Guide to Daily Adab",
          author: "DeenIslam Editorial",
          category: "PDF Books",
          language: "English",
          languageCode: "en",
          description:
            "<p>A short practical introduction to daily Islamic manners, organised exactly like an imported PDF book with separate parts and pages.</p>",
          copyright: "Copyright © DeenIslam. Created as original demo content.",
          license: "DeenIslam demo content — internal testing use",
          sourceUrl: "",
          coverImageUrl: "",
          coverImageKey: "",
          publicDomain: false,
          published: true,
          content,
          pages: parts,
          extraction: {
            method: "embedded-text",
            sourceFile: "daily-adab-demo.pdf",
            fileStored: false,
            storage: "mongodb-text",
            pageCount: 4,
            chapterCount: 2,
            averageConfidence: 100,
            needsReview: [],
            copyright: "Copyright © DeenIslam. Created as original demo content.",
          },
          updatedAt: now,
        },
        $setOnInsert: { slug, createdAt: now },
      },
      { upsert: true },
    );
    console.log(`PDF demo book ready: ${slug} (2 parts, 4 pages)`);
  } finally {
    await client.close();
  }
}

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
