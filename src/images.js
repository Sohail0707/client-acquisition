const MAX_SIDE = 2400;

// Screenshots are often multi-MB PNGs; re-encode as WebP (keeping text legible) to stay well under the upload limit.
export async function compressImage(file) {
  if (file.type === "image/gif") return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.9));
  return blob && blob.size < file.size ? blob : file;
}

export const imageFiles = (list) => [...(list || [])].filter((f) => f.type.startsWith("image/"));
