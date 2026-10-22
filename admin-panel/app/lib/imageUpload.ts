export async function convertImageToWebP(file: File, quality = 0.86): Promise<File> {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("This browser cannot convert the image.");
  }
  context.drawImage(bitmap, 0, 0);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(value => value ? resolve(value) : reject(new Error("WebP conversion failed.")), "image/webp", quality)
  );
  const baseName = file.name.replace(/\.[^.]+$/, "").replace(/[^a-z0-9_-]+/gi, "-") || "image";
  return new File([blob], `${baseName}.webp`, {type: "image/webp", lastModified: Date.now()});
}

export async function prepareWebPUpload(file: File) {
  const webp = await convertImageToWebP(file);
  return {file: webp, fileName: webp.name, contentType: "image/webp"};
}

export async function deleteManagedImage(
  apiBase: string,
  token: string,
  image: {key?: string; url?: string},
  options: {keepalive?: boolean} = {},
) {
  if (!image.key && !image.url) return;
  const isManaged = Boolean(
    image.key ||
      image.url?.includes("/api/media/") ||
      image.url?.includes("/uploads/"),
  );
  if (!isManaged) return;
  const response = await fetch(`${apiBase.replace(/\/$/, "")}/api/admin/media`, {
    method: "DELETE",
    headers: {"Content-Type": "application/json", Authorization: `Bearer ${token}`},
    body: JSON.stringify(image),
    keepalive: options.keepalive,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || "Unable to delete image from AWS S3.");
}

export async function uploadImageToS3(apiBase: string, token: string, file: File) {
  if (!file || (file.type && !file.type.startsWith("image/")))
    throw new Error("Choose a valid image file.");
  if (file.size > 10 * 1024 * 1024)
    throw new Error("Image must be 10 MB or smaller.");
  const root = apiBase.replace(/\/$/, "");
  const contentType = file.type || "application/octet-stream";
  const prepared = await fetch(`${root}/api/admin/books/cover-upload`, {
    method: "POST",
    headers: {"Content-Type": "application/json", Authorization: `Bearer ${token}`},
    body: JSON.stringify({fileName: file.name, contentType}),
  });
  const details = await prepared.json().catch(() => ({}));
  if (!prepared.ok) throw new Error(details.message || "Unable to prepare image upload.");
  const uploaded = await fetch(details.data.uploadUrl, {
    method: "PUT",
    headers: {"Content-Type": contentType},
    body: file,
  });
  const result = await uploaded.json().catch(() => ({}));
  if (!uploaded.ok) throw new Error(result.message || "Image upload failed.");
  return {
    key: details.data.key as string,
    publicUrl: details.data.publicUrl as string,
    contentType: "image/webp",
  };
}
