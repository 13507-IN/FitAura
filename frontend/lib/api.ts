import type { AIAnalysis, LookResult } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

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
