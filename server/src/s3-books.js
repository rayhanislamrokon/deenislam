const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require("crypto");
function config() {
  const region = process.env.AWS_REGION,
    bucket = process.env.AWS_S3_BOOKS_BUCKET;
  if (!region || !bucket)
    throw new Error("AWS_REGION and AWS_S3_BOOKS_BUCKET are not configured.");
  return {
    region,
    bucket,
    publicBase: (
      process.env.AWS_S3_PUBLIC_BASE_URL ||
      `https://${bucket}.s3.${region}.amazonaws.com`
    ).replace(/\/$/, ""),
  };
}
async function createBookCoverUpload({ fileName, contentType }) {
  if (contentType !== "image/webp")
    throw new Error("Images must be converted to WebP before upload.");
  const { name } = require("path").parse(String(fileName || "image"));
  const safe =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50) || "image";
  const { region, bucket, publicBase } = config();
  const key = `books/covers/${Date.now()}-${crypto.randomBytes(8).toString("hex")}-${safe}.webp`;
  const client = new S3Client({ region });
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: "image/webp",
    CacheControl: "public, max-age=31536000, immutable",
  });
  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 });
  return {
    key,
    uploadUrl,
    publicUrl: `${publicBase}/${key}`,
    contentType: "image/webp",
    expiresIn: 300,
  };
}
async function deleteBookCover(key) {
  const safe = String(key || "").trim();
  if (!safe) return false;
  if (!safe.startsWith("books/covers/"))
    throw new Error("Invalid book cover key.");
  const { region, bucket } = config();
  await new S3Client({ region }).send(
    new DeleteObjectCommand({ Bucket: bucket, Key: safe }),
  );
  return true;
}
module.exports = { createBookCoverUpload, deleteBookCover };
