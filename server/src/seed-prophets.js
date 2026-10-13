require("dotenv").config();
const fs = require("fs"),
  path = require("path"),
  vm = require("vm");
const { MongoClient } = require("mongodb");
const source = fs.readFileSync(
  path.join(__dirname, "../../app/src/data/prophetStories.ts"),
  "utf8",
);
function arrayAfter(marker) {
  const at = source.indexOf(marker),
    equal = source.indexOf("=", at),
    start = source.indexOf("[", equal);
  let depth = 0,
    quote = "",
    escaped = false;
  for (let i = start; i < source.length; i++) {
    const char = source[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = "";
      continue;
    }
    if (char === "'" || char === '"' || char === "`") {
      quote = char;
      continue;
    }
    if (char === "[") depth++;
    if (char === "]" && --depth === 0) return source.slice(start, i + 1);
  }
  throw Error("Prophet array not found");
}
const p = (title, story, reference) => ({ title, story, reference }),
  stories = vm.runInNewContext(
    "(" + arrayAfter("export const PROPHET_STORIES") + ")",
    { p },
  );
const slugify = (value) =>
  String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\(as\)|[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-");
(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const collection = client
        .db(process.env.MONGODB_DB || "deenislam")
        .collection("prophets_content"),
      now = new Date();
    for (let index = 0; index < stories.length; index++) {
      const item = stories[index],
        doc = {
          slug: slugify(item.name),
          order: index + 1,
          name: item.name,
          arabic: item.arabic,
          summary: item.summary,
          parts: item.parts.map((part, partIndex) => ({
            ...part,
            order: partIndex + 1,
          })),
          published: true,
          updatedAt: now,
        };
      await collection.updateOne(
        { slug: doc.slug },
        { $set: doc, $setOnInsert: { translations: {}, createdAt: now } },
        { upsert: true },
      );
    }
    console.log(`Seeded ${stories.length} Prophets.`);
  } finally {
    await client.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
