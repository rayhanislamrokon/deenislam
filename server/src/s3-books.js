const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const sharp = require("sharp");
function config() {
  const region = process.env.AWS_REGION,
    bucket = process.env.AWS_S3_BUCKET || process.env.AWS_S3_BOOKS_BUCKET;
  if (!region || !bucket)
    throw new Error("AWS_REGION and AWS_S3_BUCKET are not configured.");
  const uploadPrefix = String(process.env.AWS_S3_UPLOAD_PREFIX || "uploads")
    .replace(/^\/+|\/+$/g, "")
    .replace(/[^a-zA-Z0-9/_-]/g, "") || "uploads";
  return {
    region,
    bucket,
    uploadPrefix,
    publicBase: (
      process.env.AWS_CLOUDFRONT_URL ||
      process.env.AWS_S3_PUBLIC_BASE_URL ||
      `${String(process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 6002}`).replace(/\/$/, "")}/api/media`
    ).replace(/\/$/, ""),
  };
}
async function createBookCoverUpload({ fileName, contentType }) {
  const sourceType = String(contentType || "").toLowerCase();
  if (!sourceType.startsWith("image/") && sourceType !== "application/octet-stream")
    throw new Error("Choose a valid image file.");
  const { name } = require("path").parse(String(fileName || "image"));
  const safe =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50) || "image";
  const { uploadPrefix, publicBase } = config();
  const key = `${uploadPrefix}/images/${Date.now()}-${crypto.randomBytes(8).toString("hex")}-${safe}.webp`;
  if (!process.env.JWT_SECRET)
    throw new Error("JWT_SECRET is required for secure media uploads.");
  const token = jwt.sign({ purpose: "media-upload", key }, process.env.JWT_SECRET, {
    expiresIn: 300,
  });
  const apiBase = String(
    process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 6002}`,
  ).replace(/\/$/, "");
  return {
    key,
    uploadUrl: `${apiBase}/api/media-upload/${encodeURIComponent(token)}`,
    publicUrl: `${publicBase}/${key}`,
    contentType: sourceType,
    expiresIn: 300,
  };
}
async function storeWebPImage(token, input) {
  if (!process.env.JWT_SECRET) throw new Error("Media upload is not configured.");
  const payload = jwt.verify(String(token || ""), process.env.JWT_SECRET);
  if (payload?.purpose !== "media-upload" || !payload.key)
    throw new Error("Invalid media upload token.");
  const { region, bucket, uploadPrefix } = config();
  const key = String(payload.key);
  if (!key.startsWith(`${uploadPrefix}/`)) throw new Error("Invalid media key.");
  const source = Buffer.isBuffer(input) ? input : Buffer.from(input || []);
  if (!source.length) throw new Error("Image file is empty.");
  const pipeline = sharp(source, { failOn: "error", limitInputPixels: 40_000_000 });
  const metadata = await pipeline.metadata();
  if (!metadata.width || !metadata.height)
    throw new Error("The uploaded file is not a valid image.");
  const webp = await pipeline
    .rotate()
    .resize({ width: 3000, height: 3000, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 84, effort: 5 })
    .toBuffer();
  await new S3Client({ region }).send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: webp,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return { key, bytes: webp.length, width: metadata.width, height: metadata.height };
}
async function storePdfPageImage({ input, fileName, pageNumber }) {
  const source = Buffer.isBuffer(input) ? input : Buffer.from(input || []);
  if (!source.length) throw new Error("Rendered PDF page is empty.");
  const { region, bucket, uploadPrefix, publicBase } = config();
  const safe = require("path")
    .parse(String(fileName || "pdf-book"))
    .name.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 45) || "pdf-book";
  const key = `${uploadPrefix}/pdf-pages/${Date.now()}-${crypto.randomBytes(6).toString("hex")}-${safe}-page-${pageNumber}.webp`;
  await new S3Client({ region }).send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: source,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return { key, publicUrl: `${publicBase}/${key}`, bytes: source.length };
}
async function deleteBookCover(key) {
  const safe = String(key || "").trim();
  if (!safe) return false;
  const { region, bucket, uploadPrefix } = config();
  if (!safe.startsWith(`${uploadPrefix}/`) && !safe.startsWith("books/covers/"))
    throw new Error("Invalid book cover key.");
  await new S3Client({ region }).send(
    new DeleteObjectCommand({ Bucket: bucket, Key: safe }),
  );
  return true;
}
function managedMediaKey(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  let candidate = raw;
  try {
    const url = new URL(raw);
    const marker = "/api/media/";
    const index = url.pathname.indexOf(marker);
    candidate = index >= 0 ? url.pathname.slice(index + marker.length) : url.pathname.replace(/^\/+/, "");
  } catch {
    const marker = "/api/media/";
    const index = raw.indexOf(marker);
    if (index >= 0) candidate = raw.slice(index + marker.length).split(/[?#\s"'<>]/, 1)[0];
  }
  try { candidate = decodeURIComponent(candidate); } catch {}
  candidate = candidate.replace(/^\/+/, "").split(/[?#\s"'<>]/, 1)[0];
  const { uploadPrefix } = config();
  return candidate.startsWith(`${uploadPrefix}/`) || candidate.startsWith("books/covers/") ? candidate : "";
}
function collectManagedMediaKeys(value, keys = new Set(), seen = new Set()) {
  if (value == null) return keys;
  if (typeof value === "string") {
    const direct = managedMediaKey(value);
    if (direct) keys.add(direct);
    const matches = value.match(/(?:https?:\/\/[^\s"'<>]+)?\/api\/media\/[^\s"'<>]+/g) || [];
    for (const match of matches) {
      const key = managedMediaKey(match);
      if (key) keys.add(key);
    }
    return keys;
  }
  if (typeof value !== "object" || seen.has(value)) return keys;
  seen.add(value);
  for (const item of Array.isArray(value) ? value : Object.values(value))
    collectManagedMediaKeys(item, keys, seen);
  return keys;
}
async function deleteStoredImages(value) {
  const keys = [...collectManagedMediaKeys(value)];
  if (!keys.length) return [];
  await Promise.all(keys.map((key) => deleteBookCover(key)));
  return keys;
}
async function deleteReplacedImages(previous, next) {
  const oldKeys = collectManagedMediaKeys(previous);
  const newKeys = collectManagedMediaKeys(next);
  const removed = [...oldKeys].filter((key) => !newKeys.has(key));
  if (removed.length) await Promise.all(removed.map((key) => deleteBookCover(key)));
  return removed;
}
async function getStoredImage(key) {
  const safe = String(key || "").trim();
  const { region, bucket, uploadPrefix } = config();
  if (!safe.startsWith(`${uploadPrefix}/`) && !safe.startsWith("books/covers/"))
    throw new Error("Invalid media key.");
  return new S3Client({ region }).send(
    new GetObjectCommand({ Bucket: bucket, Key: safe }),
  );
}
module.exports = {
  createBookCoverUpload,
  storeWebPImage,
  storePdfPageImage,
  deleteBookCover,
  managedMediaKey,
  collectManagedMediaKeys,
  deleteStoredImages,
  deleteReplacedImages,
  getStoredImage,
};
