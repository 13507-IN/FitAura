import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import { imageBufferToTensor } from "../ml/imagePreprocess.js";
import { ensureTfBackend } from "../ml/tfBackend.js";

const FACE_SHAPES = ["oval", "round", "square", "heart", "diamond"];
const MIN_CONFIDENCE = 0.45;
let detectorPromise;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getPoint(keypoints, name, indexFallback) {
  const byName = keypoints.find((point) => point.name === name);
  if (byName) {
    return byName;
  }

  if (typeof indexFallback === "number" && keypoints[indexFallback]) {
    return keypoints[indexFallback];
  }

  return null;
}

function distance(pointA, pointB) {
  if (!pointA || !pointB) {
    return null;
  }
  return Math.hypot(pointA.x - pointB.x, pointA.y - pointB.y);
}

function classifyFaceShape(face) {
  const keypoints = Array.isArray(face.keypoints) ? face.keypoints : [];
  const leftCheek = getPoint(keypoints, "leftCheek", 234);
  const rightCheek = getPoint(keypoints, "rightCheek", 454);
  const chin = getPoint(keypoints, "chin", 152);
  const forehead = getPoint(keypoints, "forehead", 10);
  const leftJaw = keypoints[172] ?? null;
  const rightJaw = keypoints[397] ?? null;
  const leftTemple = keypoints[127] ?? null;
  const rightTemple = keypoints[356] ?? null;

  const cheekWidth = distance(leftCheek, rightCheek);
  const jawWidth = distance(leftJaw, rightJaw);
  const foreheadWidth = distance(leftTemple, rightTemple);
  const faceHeight = distance(forehead, chin);

  const boxWidth = face?.box?.width ?? null;
  const boxHeight = face?.box?.height ?? null;

  const width = cheekWidth ?? boxWidth ?? 1;
  const height = faceHeight ?? boxHeight ?? 1;
  const aspectRatio = height / width;

  if (foreheadWidth && jawWidth && foreheadWidth > jawWidth * 1.12) {
    return "heart";
  }

  if (jawWidth && foreheadWidth && jawWidth > foreheadWidth * 1.12 && aspectRatio < 1.35) {
    return "square";
  }

  if (cheekWidth && jawWidth && foreheadWidth) {
    const widest = Math.max(jawWidth, foreheadWidth);
    if (cheekWidth > widest * 1.08) {
      return "diamond";
    }
  }

  if (aspectRatio <= 1.22) {
    return "round";
  }

  return "oval";
}

function extractFaceConfidence(face) {
  const directScore = Array.isArray(face?.score) ? face.score[0] : face?.score;
  if (typeof directScore === "number") {
    return clamp(directScore, MIN_CONFIDENCE, 0.98);
  }

  const keypointScores = (face?.keypoints ?? [])
    .map((point) => point.score)
    .filter((score) => typeof score === "number");

  if (keypointScores.length > 0) {
    const avg = keypointScores.reduce((sum, score) => sum + score, 0) / keypointScores.length;
    return clamp(avg, MIN_CONFIDENCE, 0.98);
  }

  return 0.62;
}

async function getFaceDetector() {
  if (!detectorPromise) {
    detectorPromise = faceLandmarksDetection
      .createDetector(faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh, {
        runtime: "tfjs",
        refineLandmarks: true,
        maxFaces: 1
      })
      .catch((error) => {
        detectorPromise = undefined;
        throw error;
      });
  }

  return detectorPromise;
}

export async function detectFace(imageBuffer) {
  await ensureTfBackend();
  const detector = await getFaceDetector();
  const imageTensor = await imageBufferToTensor(imageBuffer, 720);

  try {
    const faces = await detector.estimateFaces(imageTensor, {
      flipHorizontal: false
    });

    if (!Array.isArray(faces) || faces.length === 0) {
      return {
        shape: FACE_SHAPES[0],
        faceConfidence: 0.5
      };
    }

    const primaryFace = faces[0];
    const shape = classifyFaceShape(primaryFace);
    const faceConfidence = Number(extractFaceConfidence(primaryFace).toFixed(2));

    return {
      shape,
      faceConfidence
    };
  } finally {
    imageTensor.dispose();
  }
}
