/**
 * Client-side image compression for uploads.
 * Resizes and compresses to JPEG/WebP to keep files under target sizes.
 */

const THUMBNAIL_MAX_SIZE = 80 * 1024; // 80KB
const PRODUCT_IMAGE_MAX_SIZE = 300 * 1024; // 300KB
const MAX_DIMENSION_THUMB = 400;
const MAX_DIMENSION_PRODUCT = 1200;
const DEFAULT_QUALITY = 0.85;

function drawImageToCanvas(
  img: HTMLImageElement,
  maxW: number,
  maxH: number
): HTMLCanvasElement {
  const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mime: "image/jpeg" | "image/webp",
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      mime,
      quality
    );
  });
}

function loadImage(src: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(src);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image load failed"));
    };
    img.src = url;
  });
}

/** Compress image to stay under maxSizeBytes. Returns blob (JPEG or WebP). */
export async function compressImage(
  file: File,
  options: {
    maxSizeBytes?: number;
    maxDimension?: number;
    preferWebP?: boolean;
  } = {}
): Promise<Blob> {
  const maxSizeBytes = options.maxSizeBytes ?? PRODUCT_IMAGE_MAX_SIZE;
  const maxDimension = options.maxDimension ?? MAX_DIMENSION_PRODUCT;
  const preferWebP = options.preferWebP ?? true;

  const img = await loadImage(file);
  const canvas = drawImageToCanvas(img, maxDimension, maxDimension);

  const mime: "image/jpeg" | "image/webp" = preferWebP ? "image/webp" : "image/jpeg";
  let quality = DEFAULT_QUALITY;
  let blob = await canvasToBlob(canvas, mime, quality);

  while (blob.size > maxSizeBytes && quality > 0.2) {
    quality -= 0.1;
    blob = await canvasToBlob(canvas, mime, quality);
  }

  if (blob.size > maxSizeBytes && mime === "image/webp") {
    blob = await canvasToBlob(canvas, "image/jpeg", DEFAULT_QUALITY);
    while (blob.size > maxSizeBytes && quality > 0.2) {
      quality -= 0.1;
      blob = await canvasToBlob(canvas, "image/jpeg", quality);
    }
  }

  return blob;
}

/** Produce a thumbnail blob (smaller dimension and size). */
export async function createThumbnail(file: File): Promise<Blob> {
  const img = await loadImage(file);
  const canvas = drawImageToCanvas(img, MAX_DIMENSION_THUMB, MAX_DIMENSION_THUMB);
  let quality = 0.85;
  let blob = await canvasToBlob(canvas, "image/webp", quality);
  while (blob.size > THUMBNAIL_MAX_SIZE && quality > 0.3) {
    quality -= 0.1;
    blob = await canvasToBlob(canvas, "image/webp", quality);
  }
  return blob;
}
