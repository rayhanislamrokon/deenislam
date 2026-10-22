require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const fs = require("fs/promises");
const path = require("path");
const { MongoClient } = require("mongodb");
const { storePdfPageImage } = require("./s3-books");

async function run() {
  const [slug, pdfPath] = process.argv.slice(2);
  if (!slug || !pdfPath)
    throw new Error("Usage: node src/repair-pdf-page-images.js <slug> <pdf-path>");
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is missing.");

  await fs.access(pdfPath);
  const { default: scribe } = await import("scribe.js-ocr");
  const client = new MongoClient(process.env.MONGODB_URI);
  let doc;
  try {
    await client.connect();
    const books = client
      .db(process.env.MONGODB_DB || "deenislam")
      .collection("books");
    const book = await books.findOne({ slug });
    if (!book) throw new Error(`Book not found: ${slug}`);

    doc = await scribe.openDocument([pdfPath]);
    const pageCount = Number(doc.images?.pageCount || doc.pageMetrics?.length || 0);
    if (!pageCount) throw new Error("The PDF contains no renderable pages.");

    const renderedPages = [];
    for (let index = 0; index < pageCount; index += 1) {
      const rendered = await doc.renderPageImage(index, {
        format: "webp",
        quality: 0.84,
        dpi: 160,
      });
      if (!rendered?.ok || !rendered.blob)
        throw new Error(`Unable to render PDF page ${index + 1}.`);
      const stored = await storePdfPageImage({
        input: Buffer.from(await rendered.blob.arrayBuffer()),
        fileName: path.basename(pdfPath),
        pageNumber: index + 1,
      });
      const dims = doc.pageMetrics?.[index]?.dims || {};
      renderedPages.push({
        originalPage: index + 1,
        imageUrl: stored.publicUrl,
        imageKey: stored.key,
        imageWidth: Number(dims.width) || 0,
        imageHeight: Number(dims.height) || 0,
      });
    }

    let cursor = 0;
    const sourceParts = Array.isArray(book.pages) ? book.pages : [];
    const pages = sourceParts.map((part) => {
      if (Array.isArray(part.pages) && part.pages.length) {
        return {
          ...part,
          pages: part.pages.map((page) => ({
            ...page,
            ...(renderedPages[cursor++] || {}),
          })),
        };
      }
      return { ...part, ...(renderedPages[cursor++] || {}) };
    });
    if (cursor !== renderedPages.length)
      throw new Error(
        `Saved book has ${cursor} pages but the PDF has ${renderedPages.length}. Re-upload it through PDF Books Manager.`,
      );

    await books.updateOne(
      { _id: book._id },
      {
        $set: {
          pages,
          extraction: {
            ...(book.extraction || {}),
            storage: "mongodb-text-and-s3-page-images",
            pageDisplay: "image",
            pageCount: renderedPages.length,
          },
          updatedAt: new Date(),
        },
      },
    );
    console.log(`Repaired ${slug}: ${renderedPages.length} exact PDF page images saved.`);
  } finally {
    try {
      if (doc) await doc.terminate();
    } catch {}
    try {
      await scribe.terminate();
    } catch {}
    await client.close();
  }
}

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
