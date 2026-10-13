require("dotenv").config();
const fs = require("fs");
const vm = require("vm");
const { MongoClient } = require("mongodb");

const source = fs.readFileSync(
  require("path").join(__dirname, "../../app/src/screens/AqidahLifeScreen.tsx"),
  "utf8",
);

function literalAfter(marker, open, close) {
  const startAt = source.indexOf(marker);
  if (startAt < 0) throw Error("Missing " + marker);
  const assignment = source.indexOf("=", startAt);
  if (assignment < 0) throw Error("Missing assignment for " + marker);
  const start = source.indexOf(open, assignment);
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
    if (char === open) depth++;
    if (char === close && --depth === 0) return source.slice(start, i + 1);
  }
  throw Error("Unclosed " + marker);
}

const evaluate = (value) =>
  vm.runInNewContext("(" + value + ")", Object.create(null));
const chapters = evaluate(literalAfter("const MUSLIM_LIFE_CHAPTERS", "[", "]"));
const quran = evaluate(literalAfter("const QURAN_FOUNDATIONS", "{", "}"));
const details = evaluate(literalAfter("const MUSLIM_LIFE_DETAILS", "{", "}"));
const sources = evaluate(literalAfter("const MUSLIM_LIFE_SOURCES", "{", "}"));
const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
const listHtml = (title, items, className = "") =>
  items?.length
    ? `<h2>${title}</h2><ul class="${className}">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : "";

function contentFor(chapter) {
  const detail = details[chapter.number] || {},
    foundation = quran[chapter.number],
    refs = sources[chapter.number] || [];
  return [
    "<h2>Detailed Explanation</h2>",
    ...(detail.explanation || []).map((text) => `<p>${escapeHtml(text)}</p>`),
    foundation
      ? `<h2>Quran Foundation</h2><h3>${escapeHtml(foundation.surah)} &mdash; ${escapeHtml(foundation.reference)}</h3><blockquote><p dir="rtl" style="text-align:right;font-size:1.35em">${escapeHtml(foundation.arabic)}</p><p>${escapeHtml(foundation.meaning)}</p></blockquote><p><strong>Lesson:</strong> ${escapeHtml(foundation.lesson)}</p><p><a href="${escapeHtml(foundation.url)}" target="_blank" rel="noopener noreferrer">Read the Quran reference</a></p>`
      : "",
    listHtml("Key Lessons", chapter.points),
    listHtml("Practical Action Plan", detail.actions),
    listHtml("Common Mistakes to Avoid", detail.mistakes),
    listHtml("Daily Self-Check", detail.checklist),
    chapter.practice
      ? `<h2>Put It into Practice</h2><p>${escapeHtml(chapter.practice)}</p>`
      : "",
    chapter.reflection
      ? `<h2>Reflection</h2><blockquote><p>${escapeHtml(chapter.reflection)}</p></blockquote>`
      : "",
    detail.summary
      ? `<h2>Chapter Summary</h2><p><strong>${escapeHtml(detail.summary)}</strong></p>`
      : "",
    refs.length
      ? `<h2>Sources & Study Notes</h2><ul>${refs.map((ref) => `<li><a href="${escapeHtml(ref.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(ref.label)}</a>${ref.note ? ` &mdash; ${escapeHtml(ref.note)}` : ""}</li>`).join("")}</ul>`
      : "",
  ]
    .filter(Boolean)
    .join("");
}

async function main() {
  if (!process.env.MONGODB_URI) throw Error("MONGODB_URI is missing.");
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const collection = client
      .db(process.env.MONGODB_DB || "deenislam")
      .collection("islamic_lifestyle");
    const now = new Date();
    for (const chapter of chapters) {
      const order = Number(chapter.number),
        foundation = quran[chapter.number] || null,
        detail = details[chapter.number] || {};
      const doc = {
        slug: `muslim-life-chapter-${chapter.number}`,
        kind: "chapter",
        section: "General Muslim Life",
        parentCategorySlug: "muslim-life",
        category: "General Muslim Life",
        title: chapter.title,
        subtitle: chapter.text,
        icon: "\u{1F4D6}",
        order,
        published: true,
        quran: foundation,
        introduction: [contentFor(chapter)],
        lessons: chapter.points || [],
        actions: detail.actions || [],
        mistakes: detail.mistakes || [],
        checklist: detail.checklist || [],
        practice: chapter.practice || "",
        reflection: chapter.reflection || "",
        summary: detail.summary || "",
        sources: sources[chapter.number] || [],
        updatedAt: now,
      };
      await collection.updateOne(
        { slug: doc.slug },
        { $set: doc, $setOnInsert: { createdAt: now } },
        { upsert: true },
      );
    }
    console.log(`Seeded ${chapters.length} Islamic Lifestyle chapters.`);
  } finally {
    await client.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
