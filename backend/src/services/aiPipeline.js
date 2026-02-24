import { detectBody } from "./detectors/bodyDetector.js";
import { detectFace } from "./detectors/faceDetector.js";
import { detectSkinTonePalette } from "./detectors/colorDetector.js";
import { describeOutfitContext, estimateDemographics } from "./providers/geminiClient.js";

const FACE_FALLBACK = { shape: "oval", faceConfidence: 0.5 };
const BODY_FALLBACK = { silhouette: "balanced", bodyConfidence: 0.5 };
const COLOR_FALLBACK = {
  skinTone: "medium",
  undertone: "neutral",
  palette: ["#D6A67A", "#AA6A47", "#6D422C", "#1F2A33"],
  colorConfidence: 0.54
};
const DEMOGRAPHIC_FALLBACK = {
  gender: "unknown",
  age: null,
  demographicConfidence: 0.4
};

function toErrorMessage(reason) {
  if (!reason) {
    return "Unknown detector failure.";
  }
  if (reason instanceof Error) {
    return reason.message;
  }
  return String(reason);
}

export async function analyzeImage(imageBuffer, mimeType) {
  const [faceResult, bodyResult, colorResult, demographicResult] = await Promise.allSettled([
    detectFace(imageBuffer),
    detectBody(imageBuffer),
    detectSkinTonePalette(imageBuffer),
    estimateDemographics({ imageBuffer, mimeType })
  ]);

  if (faceResult.status === "rejected") {
    console.warn("Face detector fallback:", faceResult.reason);
  }
  if (bodyResult.status === "rejected") {
    console.warn("Body detector fallback:", bodyResult.reason);
  }
  if (colorResult.status === "rejected") {
    console.warn("Color detector fallback:", colorResult.reason);
  }
  if (demographicResult.status === "rejected") {
    console.warn("Demographic detector fallback:", demographicResult.reason);
  }

  const faceData = faceResult.status === "fulfilled" ? faceResult.value : FACE_FALLBACK;
  const bodyData = bodyResult.status === "fulfilled" ? bodyResult.value : BODY_FALLBACK;
  const colorData = colorResult.status === "fulfilled" ? colorResult.value : COLOR_FALLBACK;
  const demographicData =
    demographicResult.status === "fulfilled" ? demographicResult.value : DEMOGRAPHIC_FALLBACK;
  const demographicWasFallback =
    demographicData.gender === "unknown" && demographicData.age === null;

  const geminiSummary = await describeOutfitContext({
    imageBuffer,
    mimeType,
    faceData,
    bodyData,
    colorData
  }).catch(() => {
    return "Keep one focal piece and balanced grooming to look polished and confident.";
  });

  const confidenceScore = Number(
    ((faceData.faceConfidence + bodyData.bodyConfidence + colorData.colorConfidence) / 3).toFixed(2)
  );

  return {
    faceData,
    bodyData,
    colorData,
    demographicData,
    geminiSummary,
    confidenceScore,
    detectorMeta: {
      face: {
        status: faceResult.status === "fulfilled" ? "ok" : "fallback",
        reason: faceResult.status === "rejected" ? toErrorMessage(faceResult.reason) : null
      },
      body: {
        status: bodyResult.status === "fulfilled" ? "ok" : "fallback",
        reason: bodyResult.status === "rejected" ? toErrorMessage(bodyResult.reason) : null
      },
      color: {
        status: colorResult.status === "fulfilled" ? "ok" : "fallback",
        reason: colorResult.status === "rejected" ? toErrorMessage(colorResult.reason) : null
      },
      demographic: {
        status:
          demographicResult.status === "fulfilled" && !demographicWasFallback ? "ok" : "fallback",
        reason:
          demographicResult.status === "rejected"
            ? toErrorMessage(demographicResult.reason)
            : demographicWasFallback
              ? "Low-confidence demographic estimate."
              : null
      }
    }
  };
}
