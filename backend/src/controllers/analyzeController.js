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
      data: suggestions
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
          : ["#DDD3C1", "#B48A64", "#4A3E3B", "#1F2430"]
      },
      geminiSummary: "Regenerated from prior style context.",
      confidenceScore: 0.72
    };

    const suggestions = buildLookRecommendations({
      occasion,
      styleVibe,
      analysis: analysisFallback,
      variantToken: String(Date.now())
    });

    return res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    return next(error);
  }
}
