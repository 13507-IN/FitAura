import type { StoredLookResult } from "@/types";

const STORAGE_KEY = "fitaura:last-result";

export function saveLookResult(result: StoredLookResult): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
}

export function loadLookResult(): StoredLookResult | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredLookResult;
  } catch {
    return null;
  }
}
