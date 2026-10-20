"use strict";

const path = require("path");
const { MongoClient } = require("mongodb");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const NUMBER = "0-9০-৯٠-٩۰-۹";

const escapeHtml = (value) =>
  String(value || "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);

const cleanExistingHtml = (html) => String(html || "")
  .replace(/<(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\/\1>/gi, "")
  .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
  .trim();

function formatPlainCommentary(value) {
  const plain = String(value || "")
    .replace(/\r\n?/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
  if (!plain) return "";

  // Put uploaded numbered explanations on their own lines. Supports Latin,
  // Bengali, Arabic-Indic and Eastern Arabic-Indic numerals.
  const withPointLines = plain.replace(
    new RegExp(`\\s+(?=[${NUMBER}]+[.)।]\\s+)`, "gu"),
    "\n",
  );
  const marker = new RegExp(`^([${NUMBER}]+)[.)।]\\s+(.+)$`, "u");
  const lines = withPointLines
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const introduction = [];
  const points = [];
  let currentPoint = "";

  for (const line of lines) {
    const match = line.match(marker);
    if (match) {
      if (currentPoint) points.push(currentPoint);
      currentPoint = match[2].trim();
    } else if (currentPoint) {
      currentPoint += ` ${line}`;
    } else {
      introduction.push(line);
    }
  }
  if (currentPoint) points.push(currentPoint);

  const paragraphs = introduction
    .flatMap((line) => line.split(/\n{2,}/))
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("");
  const list = points.length
    ? `<ol>${points.map((point) => `<li><p>${escapeHtml(point)}</p></li>`).join("")}</ol>`
    : "";

  return paragraphs + list || `<p>${escapeHtml(plain)}</p>`;
}

function formatCommentary(value) {
  const raw = String(value || "").trim();
  if (/<(?:p|h[1-6]|ol|ul|li|blockquote)\b/i.test(raw)) {
    return cleanExistingHtml(raw);
  }
  return formatPlainCommentary(raw);
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is missing.");
  const apply = process.argv.includes("--apply");
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();

  try {
    const db = client.db(process.env.MONGODB_DB || "deenislam");
    const collection = db.collection("tafsir_content");
    const rows = await collection.find({ recordType: "commentary" }).toArray();
    const changes = rows
      .map((row) => ({ row, formatted: formatCommentary(row.text) }))
      .filter(({ row, formatted }) => formatted && formatted !== String(row.text || "").trim());

    console.log(`${rows.length} Tafsir records checked; ${changes.length} need formatting.`);
    if (!apply || !changes.length) {
      console.log(apply ? "Nothing to update." : "Dry run only. Re-run with --apply to save changes.");
      return;
    }

    const batchId = `tafsir-format-${new Date().toISOString()}`;
    const backupCollection = db.collection("tafsir_content_format_backups");
    await backupCollection.insertMany(changes.map(({ row }) => ({
      batchId,
      backedUpAt: new Date(),
      originalId: row._id,
      document: row,
    })));

    const result = await collection.bulkWrite(changes.map(({ row, formatted }) => ({
      updateOne: {
        filter: { _id: row._id },
        update: { $set: { text: formatted, formatVersion: 1, formattedAt: new Date(), updatedAt: new Date() } },
      },
    })), { ordered: true });

    console.log(`${result.modifiedCount} Tafsir records formatted successfully.`);
    console.log(`Backup batch: ${batchId}`);
  } finally {
    await client.close();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}

module.exports = { formatCommentary, formatPlainCommentary };
