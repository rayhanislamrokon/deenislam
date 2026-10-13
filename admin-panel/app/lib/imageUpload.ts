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
