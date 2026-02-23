import type { AIAnalysis, LookResult } from "@/types";

const FALLBACK_API_BASE = "http://localhost:8080";

function normalizeApiBaseUrl(rawValue?: string): string {
  if (!rawValue || rawValue.trim().length === 0) {
    return FALLBACK_API_BASE;
  }

  const firstValue = rawValue
    .split(",")
    .map((value) => value.trim())
    .find((value) => value.length > 0);

  if (!firstValue) {
    return FALLBACK_API_BASE;
  }

  const fixedScheme = firstValue
    .replace(/^http\/\//i, "http://")
    .replace(/^https\/\//i, "https://")
    .replace(/\/+$/, "");

  try {
    const validated = new URL(fixedScheme);
    return validated.origin;
  } catch {
    return FALLBACK_API_BASE;
  }
}

const API_BASE = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    const message = typeof data?.error === "string" ? data.error : "Request failed.";
    throw new Error(message);
  }

  return data as T;
}

export async function analyzeLook(formData: FormData): Promise<LookResult> {
  const response = await fetch(`${API_BASE}/api/analyze`, {
    method: "POST",
    body: formData
  });

  const data = await parseResponse<{ success: boolean; data: LookResult; analysis?: AIAnalysis }>(response);
  return {
    ...data.data,
    analysis: data.analysis
  };
}

export async function regenerateLook(payload: {
  occasion: string;
  styleVibe: string;
  basePalette?: string[];
}): Promise<LookResult> {
  const response = await fetch(`${API_BASE}/api/regenerate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await parseResponse<{ success: boolean; data: LookResult; analysis?: AIAnalysis }>(response);
  return {
    ...data.data,
    analysis: data.analysis
  };
}
