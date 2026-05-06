import { OCCASION_OPTIONS, STYLE_OPTIONS } from "../utils/constants.js";
import { analyzeImage } from "../services/aiPipeline.js";
import { buildLookRecommendations, buildShoppingLinks } from "../services/recommender.js";

function validateOccasion(occasion) {
  return OCCASION_OPTIONS.includes(occasion);
}

function validateStyle(styleVibe) {
  if (!styleVibe || styleVibe === "Auto") {
    return true;
  }
  return STYLE_OPTIONS.includes(styleVibe);
}

function toAnalysisResponse(analysis) {
  return {
    face: {
      shape: analysis.faceData.shape,
      confidence: analysis.faceData.faceConfidence,
      status: analysis.detectorMeta?.face?.status ?? "ok",
      reason: analysis.detectorMeta?.face?.reason ?? null
    },
    body: {
      silhouette: analysis.bodyData.silhouette,
      confidence: analysis.bodyData.bodyConfidence,
      status: analysis.detectorMeta?.body?.status ?? "ok",
      reason: analysis.detectorMeta?.body?.reason ?? null
    },
    color: {
      skinTone: analysis.colorData.skinTone,
      undertone: analysis.colorData.undertone,
      palette: analysis.colorData.palette,
      confidence: analysis.colorData.colorConfidence,
      status: analysis.detectorMeta?.color?.status ?? "ok",
      reason: analysis.detectorMeta?.color?.reason ?? null
    },
    demographic: {
      gender: analysis.demographicData.gender,
      age: analysis.demographicData.age,
      confidence: analysis.demographicData.demographicConfidence,
      status: analysis.detectorMeta?.demographic?.status ?? "ok",
      reason: analysis.detectorMeta?.demographic?.reason ?? null
    },
    geminiSummary: analysis.geminiSummary,
    overallConfidence: analysis.confidenceScore
  };
}

function mergeAnalysisResults(analyses) {
  const merged = {
    faceData: { shape: "", faceConfidence: 0 },
    bodyData: { silhouette: "", bodyConfidence: 0 },
    colorData: { skinTone: "", undertone: "", palette: [], colorConfidence: 0 },
    demographicData: { gender: "unknown", age: null, demographicConfidence: 0 },
    geminiSummary: "",
    confidenceScore: 0,
    detectorMeta: {}
  };

  const faceShapes = {};
  const silhouettes = {};
  let bestFaceIdx = 0, bestBodyIdx = 0, bestColorIdx = 0, bestDemoIdx = 0;

  analyses.forEach((a, idx) => {
    if (!a) return;
    if (a.faceData?.shape) {
      faceShapes[a.faceData.shape] = (faceShapes[a.faceData.shape] || 0) + 1;
      if ((a.faceData.faceConfidence || 0) > (analyses[bestFaceIdx]?.faceData?.faceConfidence || 0)) {
        bestFaceIdx = idx;
      }
    }
    if (a.bodyData?.silhouette) {
      silhouettes[a.bodyData.silhouette] = (silhouettes[a.bodyData.silhouette] || 0) + 1;
      if ((a.bodyData.bodyConfidence || 0) > (analyses[bestBodyIdx]?.bodyData?.bodyConfidence || 0)) {
        bestBodyIdx = idx;
      }
    }
    if ((a.colorData?.colorConfidence || 0) > (analyses[bestColorIdx]?.colorData?.colorConfidence || 0)) {
      bestColorIdx = idx;
    }
    if ((a.demographicData?.demographicConfidence || 0) > (analyses[bestDemoIdx]?.demographicData?.demographicConfidence || 0)) {
      bestDemoIdx = idx;
    }
  });

  const mostCommonFace = Object.entries(faceShapes).sort((a, b) => b[1] - a[1])[0]?.[0];
  const mostCommonBody = Object.entries(silhouettes).sort((a, b) => b[1] - a[1])[0]?.[0];

  const bestFace = analyses[bestFaceIdx];
  const bestBody = analyses[bestBodyIdx];
  const bestColor = analyses[bestColorIdx];
  const bestDemo = analyses[bestDemoIdx];

  if (bestFace?.faceData) {
    merged.faceData = {
      shape: mostCommonFace || bestFace.faceData.shape,
      faceConfidence: bestFace.faceData.faceConfidence
    };
  }
  if (bestBody?.bodyData) {
    merged.bodyData = {
      silhouette: mostCommonBody || bestBody.bodyData.silhouette,
      bodyConfidence: bestBody.bodyData.bodyConfidence
    };
  }
  if (bestColor?.colorData) {
    merged.colorData = {
      skinTone: bestColor.colorData.skinTone,
      undertone: bestColor.colorData.undertone,
      palette: bestColor.colorData.palette,
      colorConfidence: bestColor.colorData.colorConfidence
    };
  }
  if (bestDemo?.demographicData) {
    merged.demographicData = {
      gender: bestDemo.demographicData.gender,
      age: bestDemo.demographicData.age,
      demographicConfidence: bestDemo.demographicData.demographicConfidence
    };
  }

  const geminiSummaries = analyses.map(a => a?.geminiSummary).filter(Boolean);
  merged.geminiSummary = geminiSummaries.length > 0 ? geminiSummaries.join(" ") : "";

  const confidences = analyses.map(a => a?.confidenceScore || 0).filter(c => c > 0);
  merged.confidenceScore = confidences.length > 0 ? confidences.reduce((s, c) => s + c, 0) / confidences.length : 0.5;

  merged.detectorMeta = {
    face: { status: "multi-photo", reason: `${analyses.length} photos analyzed` },
    body: { status: "multi-photo", reason: `${analyses.length} photos analyzed` },
    color: { status: "multi-photo", reason: `${analyses.length} photos analyzed` },
    demographic: { status: "multi-photo", reason: `${analyses.length} photos analyzed` }
  };

  return merged;
}

export async function analyzeLookController(req, res, next) {
  try {
    const image = req.file;
    const occasion = req.body.occasion;
    const styleVibe = req.body.styleVibe || "Auto";

    if (!image) {
      return res.status(400).json({
        success: false,
        error: "Image is required."
      });
    }

    if (!validateOccasion(occasion)) {
      return res.status(400).json({
        success: false,
        error: "Invalid occasion selected."
      });
    }

    if (!validateStyle(styleVibe)) {
      return res.status(400).json({
        success: false,
        error: "Invalid style vibe selected."
      });
    }

    const analysis = await analyzeImage(image.buffer, image.mimetype);

    const suggestions = buildLookRecommendations({
      occasion,
      styleVibe,
      analysis,
      variantToken: String(Date.now())
    });

    return res.json({
      success: true,
      data: suggestions,
      analysis: toAnalysisResponse(analysis)
    });
  } catch (error) {
    return next(error);
  }
}

export async function regenerateLookController(req, res, next) {
  try {
    const { occasion, styleVibe = "Auto", basePalette = [] } = req.body ?? {};

    if (!validateOccasion(occasion)) {
      return res.status(400).json({
        success: false,
        error: "Invalid occasion selected."
      });
    }

    if (!validateStyle(styleVibe)) {
      return res.status(400).json({
        success: false,
        error: "Invalid style vibe selected."
      });
    }

    const analysisFallback = {
      faceData: { shape: "oval", faceConfidence: 0.7 },
      bodyData: { silhouette: "balanced", bodyConfidence: 0.68 },
      colorData: {
        skinTone: "neutral",
        undertone: "neutral",
        palette: Array.isArray(basePalette) && basePalette.length > 0
          ? basePalette
          : ["#DDD3C1", "#B48A64", "#4A3E3B", "#1F2430"],
        colorConfidence: 0.69
      },
      demographicData: {
        gender: "unknown",
        age: null,
        demographicConfidence: 0.4
      },
      geminiSummary: "Regenerated from prior style context.",
      confidenceScore: 0.72,
      detectorMeta: {
        face: { status: "regenerated", reason: null },
        body: { status: "regenerated", reason: null },
        color: { status: "regenerated", reason: null },
        demographic: { status: "regenerated", reason: null }
      }
    };

    const suggestions = buildLookRecommendations({
      occasion,
      styleVibe,
      analysis: analysisFallback,
      variantToken: String(Date.now())
    });

    return res.json({
      success: true,
      data: suggestions,
      analysis: toAnalysisResponse(analysisFallback)
    });
  } catch (error) {
    return next(error);
  }
}

export async function analyzeMultiPhotoController(req, res, next) {
  try {
    const files = req.files;
    const occasion = req.body.occasion;
    const styleVibe = req.body.styleVibe || "Auto";
    const wardrobeJson = req.body.wardrobe || "[]";

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: "At least one image is required."
      });
    }

    if (!validateOccasion(occasion)) {
      return res.status(400).json({
        success: false,
        error: "Invalid occasion selected."
      });
    }

    if (!validateStyle(styleVibe)) {
      return res.status(400).json({
        success: false,
        error: "Invalid style vibe selected."
      });
    }

    const analyses = await Promise.all(
      files.map(file => analyzeImage(file.buffer, file.mimetype).catch(() => null))
    );

    const validAnalyses = analyses.filter(Boolean);
    if (validAnalyses.length === 0) {
      return res.status(500).json({
        success: false,
        error: "Failed to analyze any of the provided images."
      });
    }

    const mergedAnalysis = mergeAnalysisResults(validAnalyses);

    let wardrobeItems = [];
    try {
      wardrobeItems = JSON.parse(wardrobeJson);
    } catch {
      // ignore parse errors
    }

    const suggestions = buildLookRecommendations({
      occasion,
      styleVibe,
      analysis: mergedAnalysis,
      variantToken: String(Date.now()),
      wardrobe: wardrobeItems
    });

    suggestions.shoppingLinks = buildShoppingLinks(suggestions, occasion, styleVibe);

    return res.json({
      success: true,
      data: suggestions,
      analysis: toAnalysisResponse(mergedAnalysis)
    });
  } catch (error) {
    return next(error);
  }
}
