import sharp from "sharp";
import * as tf from "@tensorflow/tfjs";

export const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function normalizeMimeType(mimeType) {
  if (!mimeType) {
    return "image/jpeg";
  }

  const normalized = String(mimeType).toLowerCase();
  if (ALLOWED_IMAGE_TYPES.has(normalized)) {
    return normalized;
  }

  return "image/jpeg";
}

export async function preprocessForModel(imageBuffer, maxSide = 640) {
  return sharp(imageBuffer)
    .rotate()
    .resize({
      width: maxSide,
      height: maxSide,
      fit: "inside",
      withoutEnlargement: true
    })
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();
}

export async function preprocessForGemini(imageBuffer, maxSide = 1280) {
  return sharp(imageBuffer)
    .rotate()
    .resize({
      width: maxSide,
      height: maxSide,
      fit: "inside",
      withoutEnlargement: true
    })
    .jpeg({ quality: 84, mozjpeg: true })
    .toBuffer();
}

export async function toRawPixels(imageBuffer, maxSide = 320) {
  const { data, info } = await sharp(imageBuffer)
    .rotate()
    .resize({
      width: maxSide,
      height: maxSide,
      fit: "inside",
      withoutEnlargement: true
    })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return {
    data,
    width: info.width,
    height: info.height,
    channels: info.channels
  };
}

export async function imageBufferToTensor(imageBuffer, maxSide = 720) {
  const { data, info } = await sharp(imageBuffer)
    .rotate()
    .resize({
      width: maxSide,
      height: maxSide,
      fit: "inside",
      withoutEnlargement: true
    })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = Number(info?.width ?? 0);
  const height = Number(info?.height ?? 0);

  if (!width || !height) {
    throw new Error("Unable to decode image dimensions for tensor conversion.");
  }

  const intData = Int32Array.from(data);
  return tf.tensor3d(intData, [height, width, 3], "int32");
}
