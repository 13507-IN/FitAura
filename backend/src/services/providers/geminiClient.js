import { normalizeMimeType, preprocessForGemini } from "../ml/imagePreprocess.js";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_SAFE_TIP =
  "Keep your outfit balanced with one focal piece and maintain clean, intentional grooming.";
const DEFAULT_DEMOGRAPHIC_DATA = {
  gender: "unknown",
  age: null,
  demographicConfidence: 0.4
};
const MAX_TEXT_LENGTH = 220;
const BLOCKED_FINISH_REASONS = new Set(["SAFETY", "BLOCKLIST", "PROHIBITED_CONTENT", "SPII"]);

const SYSTEM_PROMPT = `
You are FitAura's fashion assistant.
Respond only with practical and respectful styling guidance.

Guardrails:
- Focus only on outfit coordination, grooming, and confidence cues.
- Do not infer or mention race, ethnicity, religion, nationality, disability, health, or age.
- Do not give sexual, romantic, or body-shaming remarks.
- Avoid negative appearance judgments.
- Keep each field concise and neutral.

Output format:
Return strict JSON with this schema:
{
  "confidence_tip": string,
  "grooming_tip": string,
  "style_note": string
}
`.trim();

const OUTPUT_SCHEMA = {
  type: "OBJECT",
  properties: {
    confidence_tip: { type: "STRING" },
    grooming_tip: { type: "STRING" },
    style_note: { type: "STRING" }
  },
  required: ["confidence_tip", "grooming_tip", "style_note"]
};

const DEMOGRAPHIC_SYSTEM_PROMPT = `
You are FitAura's demographic-estimation assistant for styling personalization.
Estimate only likely visible gender presentation and approximate age.

Guardrails:
- Never infer race, ethnicity, religion, nationality, disability, health, or sexual orientation.
- If uncertain, set gender to "unknown".
- If uncertain about age, set age_estimate to 0.
- Keep confidence between 0 and 1.

Output format:
Return strict JSON with this schema:
{
  "gender": string,
  "age_estimate": number,
  "confidence": number
}
`.trim();

const DEMOGRAPHIC_OUTPUT_SCHEMA = {
  type: "OBJECT",
  properties: {
    gender: { type: "STRING" },
    age_estimate: { type: "NUMBER" },
    confidence: { type: "NUMBER" }
  },
  required: ["gender", "age_estimate", "confidence"]
};

function sanitizeText(raw) {
  if (typeof raw !== "string") {
    return "";
  }

  const normalized = raw.replace(/\s+/g, " ").trim();
  return normalized.slice(0, MAX_TEXT_LENGTH);
}

function containsSensitiveInference(text) {
  const forbidden = [
    /\brace\b/i,
    /\bethnic/i,
    /\breligio/i,
    /\bnationalit/i,
    /\bdisab/i,
    /\bmedical\b/i,
    /\bdisease\b/i,
    /\bdiagnos/i,
    /\bmental\b/i,
    /\bsexual\b/i,
    /\bage\b/i
  ];

  return forbidden.some((rule) => rule.test(text));
}

function extractCandidateText(data) {
  const candidate = data?.candidates?.[0];
  if (!candidate) {
    return "";
  }

  if (BLOCKED_FINISH_REASONS.has(candidate.finishReason)) {
    return "";
  }

  return candidate?.content?.parts
    ?.map((part) => part?.text)
    .filter((part) => typeof part === "string")
    .join(" ")
    .trim();
}

function parseJsonFromText(raw) {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    const jsonCandidate = raw.match(/\{[\s\S]*\}/)?.[0];
    if (!jsonCandidate) {
      return null;
    }

    try {
      return JSON.parse(jsonCandidate);
    } catch {
      return null;
    }
  }
}

function buildUserPrompt({ faceData, bodyData, colorData }) {
  return [
    "Provide concise style guidance for this uploaded portrait.",
    "Use the image first, then incorporate metadata below for context.",
    `Detected face shape: ${faceData.shape}`,
    `Detected body silhouette: ${bodyData.silhouette}`,
    `Detected undertone: ${colorData.undertone}`,
    `Detected skin tone bucket: ${colorData.skinTone}`,
    `Detected palette candidates: ${colorData.palette.join(", ")}`
  ].join("\n");
}

function deriveSafeTip(parsedResponse) {
  const confidenceTip = sanitizeText(parsedResponse?.confidence_tip);
  const groomingTip = sanitizeText(parsedResponse?.grooming_tip);
  const styleNote = sanitizeText(parsedResponse?.style_note);

  const merged = [confidenceTip, groomingTip, styleNote]
    .filter((text) => text.length > 0)
    .join(" ");

  if (!merged) {
    return DEFAULT_SAFE_TIP;
  }

  if (containsSensitiveInference(merged)) {
    return DEFAULT_SAFE_TIP;
  }

  return sanitizeText(merged);
}

function createTimeoutController(timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  return {
    controller,
    clear: () => clearTimeout(timeout)
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeGender(rawGender) {
  if (typeof rawGender !== "string") {
    return "unknown";
  }

  const cleaned = rawGender.trim().toLowerCase();

  if (/(^|\W)female($|\W)|\bwoman\b|\bfeminine\b/.test(cleaned)) {
    return "female";
  }

  if (/(^|\W)male($|\W)|\bman\b|\bmasculine\b/.test(cleaned)) {
    return "male";
  }

  if (/\bandrog/i.test(cleaned)) {
    return "androgynous";
  }

  return "unknown";
}

function normalizeAge(rawAge) {
  const numericAge =
    typeof rawAge === "number" ? rawAge : typeof rawAge === "string" ? Number.parseFloat(rawAge) : NaN;

  if (!Number.isFinite(numericAge) || numericAge <= 0) {
    return null;
  }

  return Math.round(clamp(numericAge, 12, 80));
}

function normalizeConfidence(rawConfidence) {
  const numeric = typeof rawConfidence === "number" ? rawConfidence : Number.parseFloat(rawConfidence);
  if (!Number.isFinite(numeric)) {
    return DEFAULT_DEMOGRAPHIC_DATA.demographicConfidence;
  }

  return Number(clamp(numeric, 0, 1).toFixed(2));
}

function deriveDemographicData(parsedResponse) {
  const gender = normalizeGender(parsedResponse?.gender);
  const age = normalizeAge(parsedResponse?.age_estimate);
  const demographicConfidence = normalizeConfidence(parsedResponse?.confidence);

  if (gender === "unknown" && age === null) {
    return DEFAULT_DEMOGRAPHIC_DATA;
  }

  return {
    gender,
    age,
    demographicConfidence
  };
}

export async function describeOutfitContext({ imageBuffer, mimeType, faceData, bodyData, colorData }) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";

  if (!apiKey) {
    return DEFAULT_SAFE_TIP;
  }

  const optimizedImage = await preprocessForGemini(imageBuffer, 1200);
  const normalizedMimeType = normalizeMimeType(mimeType);
  const prompt = buildUserPrompt({ faceData, bodyData, colorData });

  const timeoutMs = Number(process.env.GEMINI_TIMEOUT_MS || 10000);
  const { controller, clear } = createTimeoutController(timeoutMs);

  try {
    const response = await fetch(`${GEMINI_URL}/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }]
        },
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: normalizedMimeType,
                  data: optimizedImage.toString("base64")
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topP: 0.85,
          topK: 32,
          maxOutputTokens: 180,
          responseMimeType: "application/json",
          responseSchema: OUTPUT_SCHEMA
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
        ]
      })
    });

    if (!response.ok) {
      return DEFAULT_SAFE_TIP;
    }

    const data = await response.json();
    if (data?.promptFeedback?.blockReason) {
      return DEFAULT_SAFE_TIP;
    }

    const rawText = extractCandidateText(data);
    const parsed = parseJsonFromText(rawText);
    if (!parsed) {
      return DEFAULT_SAFE_TIP;
    }

    return deriveSafeTip(parsed);
  } catch {
    return DEFAULT_SAFE_TIP;
  } finally {
    clear();
  }
}

export async function estimateDemographics({ imageBuffer, mimeType }) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";

  if (!apiKey) {
    return DEFAULT_DEMOGRAPHIC_DATA;
  }

  const optimizedImage = await preprocessForGemini(imageBuffer, 1200);
  const normalizedMimeType = normalizeMimeType(mimeType);
  const timeoutMs = Number(process.env.GEMINI_TIMEOUT_MS || 10000);
  const { controller, clear } = createTimeoutController(timeoutMs);

  try {
    const response = await fetch(`${GEMINI_URL}/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: DEMOGRAPHIC_SYSTEM_PROMPT }]
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: "Estimate likely visible gender presentation and approximate age for styling context."
              },
              {
                inlineData: {
                  mimeType: normalizedMimeType,
                  data: optimizedImage.toString("base64")
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          topP: 0.8,
          topK: 24,
          maxOutputTokens: 80,
          responseMimeType: "application/json",
          responseSchema: DEMOGRAPHIC_OUTPUT_SCHEMA
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
        ]
      })
    });

    if (!response.ok) {
      return DEFAULT_DEMOGRAPHIC_DATA;
    }

    const data = await response.json();
    if (data?.promptFeedback?.blockReason) {
      return DEFAULT_DEMOGRAPHIC_DATA;
    }

    const rawText = extractCandidateText(data);
    const parsed = parseJsonFromText(rawText);
    if (!parsed) {
      return DEFAULT_DEMOGRAPHIC_DATA;
    }

    return deriveDemographicData(parsed);
  } catch {
    return DEFAULT_DEMOGRAPHIC_DATA;
  } finally {
    clear();
  }
}
