import { normalizeMimeType, preprocessForGemini } from "../ml/imagePreprocess.js";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_SAFE_TIP =
  "Keep your outfit balanced with one focal piece and maintain clean, intentional grooming.";
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
