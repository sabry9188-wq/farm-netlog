// Shrinks a photo in the browser before upload: scales it so the longest
// side is at most `maxSide` px and re-encodes it as JPEG. A 3–5 MB phone
// photo of a paper sheet comes out around 200–500 KB and stays legible.
// Falls back to the original file if the browser can't decode it (e.g. some
// HEIC files) or if compressing wouldn't make it smaller.
export async function compressImage(file: File, maxSide = 1800, quality = 0.72): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  try {
    // `from-image` applies the photo's EXIF rotation so portrait shots stay upright.
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    // JPEG has no transparency — paint white first so PNG screenshots don't go black.
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  }
}
