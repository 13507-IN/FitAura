import { OCCASION_OPTIONS, STYLE_OPTIONS } from "../utils/constants.js";
import { analyzeImage } from "../services/aiPipeline.js";
import { buildLookRecommendations } from "../services/recommender.js";

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
    geminiSummary: analysis.geminiSummary,
    overallConfidence: analysis.confidenceScore
  };
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
      geminiSummary: "Regenerated from prior style context.",
      confidenceScore: 0.72,
      detectorMeta: {
        face: { status: "regenerated", reason: null },
        body: { status: "regenerated", reason: null },
        color: { status: "regenerated", reason: null }
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
