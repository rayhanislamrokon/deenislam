require("dotenv").config();
const fs = require("fs"),
  path = require("path"),
  vm = require("vm");
const { MongoClient } = require("mongodb");
const dataDir = path.join(__dirname, "../../app/src/data");
function literal(file, marker, open, close) {
  const source = fs.readFileSync(path.join(dataDir, file), "utf8"),
    at = source.indexOf(marker),
    equal = source.indexOf("=", at),
    start = source.indexOf(open, equal);
  let depth = 0,
    quote = "",
    escaped = false;
  for (let i = start; i < source.length; i++) {
    const c = source[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === quote) quote = "";
      continue;
    }
    if (c === "'" || c === '"' || c === "`") {
      quote = c;
      continue;
    }
    if (c === open) depth++;
    if (c === close && --depth === 0) return source.slice(start, i + 1);
  }
  throw Error("Literal not found: " + file);
}
const parts = vm.runInNewContext(
  "(" + literal("adamStory.ts", "ADAM_STORY_PARTS", "[", "]") + ")",
);
for (let index = 0; index < 8; index++) {
  const file = `adamPart${index + 1}Article.ts`,
    source = fs.readFileSync(path.join(dataDir, file), "utf8"),
    equal = source.indexOf("="),
    value = source
      .slice(equal + 1)
      .trim()
      .replace(/;\s*$/, "");
  parts[index].story = vm.runInNewContext("(" + value + ")");
}
(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const result = await client
      .db(process.env.MONGODB_DB || "deenislam")
      .collection("prophets_content")
      .updateOne(
        { slug: "adam" },
        {
          $set: {
            name: "Adam (AS)",
            arabic: "آدَم",
            summary: "The first human and Prophet.",
            parts: parts.map((item, index) => ({
              title: item.title,
              story: item.story,
              reference: item.reference,
              note: item.note || "",
              order: index + 1,
            })),
            updatedAt: new Date(),
          },
        },
      );
    if (!result.matchedCount) throw Error("Adam record not found");
    console.log(
      `Restored Adam full story: ${parts.length} parts, 8 detailed articles.`,
    );
  } finally {
    await client.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
