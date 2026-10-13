require("dotenv").config();
const fs = require("fs");
const path = require("path");
const vm = require("vm");
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
  for (let i = start; i < source.length; i += 1) {
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
    if (char === "[") depth += 1;
    if (char === "]" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("Prophet array not found");
}
const p = (title, story, reference) => ({ title, story, reference });
const stories = vm.runInNewContext(
  `(${arrayAfter("export const PROPHET_STORIES")})`,
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
    const saved = await client
      .db(process.env.MONGODB_DB || "deenislam")
      .collection("prophets_content")
      .find({})
      .toArray();
    const bySlug = new Map(saved.map((item) => [item.slug, item]));
    const missing = [],
      empty = [];
    let sourceParts = 0,
      savedParts = 0;
    for (const item of stories) {
      const record = bySlug.get(slugify(item.name));
      sourceParts += item.parts.length;
      if (!record) {
        missing.push(item.name);
        continue;
      }
      const parts = Array.isArray(record.parts) ? record.parts : [];
      savedParts += parts.length;
      if (
        !parts.length ||
        parts.some((part) => !String(part.story || "").trim())
      )
        empty.push(item.name);
    }
    console.log(
      JSON.stringify(
        {
          sourceProphets: stories.length,
          savedProphets: saved.length,
          sourceParts,
          savedParts,
          missing,
          empty,
        },
        null,
        2,
      ),
    );
    if (missing.length || empty.length) process.exitCode = 1;
  } finally {
    await client.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
