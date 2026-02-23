import * as poseDetection from "@tensorflow-models/pose-detection";
import { imageBufferToTensor } from "../ml/imagePreprocess.js";
import { ensureTfBackend } from "../ml/tfBackend.js";

const BODY_SILHOUETTES = ["balanced", "athletic", "lean", "broad-shouldered"];
let detectorPromise;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

const KEYPOINT_INDEX = {
  left_shoulder: 11,
  right_shoulder: 12,
  left_hip: 23,
  right_hip: 24
};

function getKeypoint(keypoints, name) {
  const byName = keypoints.find((point) => point.name === name);
  if (byName) {
    return byName;
  }

  const fallbackIndex = KEYPOINT_INDEX[name];
  if (typeof fallbackIndex === "number" && keypoints[fallbackIndex]) {
    return keypoints[fallbackIndex];
  }

  return null;
}

function distance(pointA, pointB) {
  if (!pointA || !pointB) {
    return null;
  }

  return Math.hypot(pointA.x - pointB.x, pointA.y - pointB.y);
}

function average(values) {
  if (values.length === 0) {
    return null;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function classifySilhouette(pose) {
  const keypoints = Array.isArray(pose?.keypoints) ? pose.keypoints : [];
  const visiblePoints = keypoints.filter((point) => typeof point.score === "number" && point.score >= 0.25);

  const leftShoulder = getKeypoint(keypoints, "left_shoulder");
  const rightShoulder = getKeypoint(keypoints, "right_shoulder");
  const leftHip = getKeypoint(keypoints, "left_hip");
  const rightHip = getKeypoint(keypoints, "right_hip");

  const shoulderWidth = distance(leftShoulder, rightShoulder);
  const hipWidth = distance(leftHip, rightHip);

  if (!shoulderWidth || !hipWidth) {
    return BODY_SILHOUETTES[0];
  }

  const ratio = shoulderWidth / hipWidth;
  const xs = visiblePoints.map((point) => point.x);
  const ys = visiblePoints.map((point) => point.y);

  const boxWidth = xs.length > 0 ? Math.max(...xs) - Math.min(...xs) : shoulderWidth;
  const boxHeight = ys.length > 0 ? Math.max(...ys) - Math.min(...ys) : hipWidth;
  const frameRatio = boxHeight / Math.max(boxWidth, 1);

  if (ratio > 1.22) {
    return "broad-shouldered";
  }

  if (ratio >= 1.07 && frameRatio > 1.45) {
    return "athletic";
  }

  if (ratio < 0.95 || frameRatio > 1.78) {
    return "lean";
  }

  return "balanced";
}

function extractBodyConfidence(pose) {
  const poseScore = typeof pose?.score === "number" ? pose.score : null;

  const keypointScores = (pose?.keypoints ?? [])
    .map((point) => point.score)
    .filter((score) => typeof score === "number");

  const meanKeypointScore = average(keypointScores);
  const baseScore = poseScore ?? meanKeypointScore ?? 0.58;
  return Number(clamp(baseScore, 0.45, 0.96).toFixed(2));
}

async function getPoseDetector() {
  if (!detectorPromise) {
    detectorPromise = poseDetection
      .createDetector(poseDetection.SupportedModels.BlazePose, {
        runtime: "tfjs",
        modelType: "full",
        enableSmoothing: true
      })
      .catch((error) => {
        detectorPromise = undefined;
        throw error;
      });
  }

  return detectorPromise;
}

export async function detectBody(imageBuffer) {
  await ensureTfBackend();
  const detector = await getPoseDetector();
  const imageTensor = await imageBufferToTensor(imageBuffer, 720);

  try {
    const poses = await detector.estimatePoses(imageTensor, {
      flipHorizontal: false
    });

    if (!Array.isArray(poses) || poses.length === 0) {
      return {
        silhouette: BODY_SILHOUETTES[0],
        bodyConfidence: 0.5
      };
    }

    const pose = poses[0];

    return {
      silhouette: classifySilhouette(pose),
      bodyConfidence: extractBodyConfidence(pose)
    };
  } finally {
    imageTensor.dispose();
  }
}
