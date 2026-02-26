import type { StoredLookResult } from "@/types";

const STORAGE_KEY = "fitaura:last-result";
const HISTORY_KEY = "fitaura:history";
const MAX_HISTORY_ITEMS = 8;

function addTimestamp(result: StoredLookResult): StoredLookResult {
  return {
    ...result,
    createdAt: result.createdAt ?? new Date().toISOString()
  };
}

function parseStoredLook(raw: string): StoredLookResult | null {
  try {
    const parsed = JSON.parse(raw) as StoredLookResult;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return addTimestamp(parsed);
  } catch {
    return null;
  }
}

export function saveLookResult(result: StoredLookResult): void {
  if (typeof window === "undefined") {
    return;
  }

  const stampedResult = addTimestamp(result);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stampedResult));

  const history = loadLookHistory();
  const filtered = history.filter((entry) => entry.createdAt !== stampedResult.createdAt);
  const updatedHistory = [stampedResult, ...filtered].slice(0, MAX_HISTORY_ITEMS);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
}

export function loadLookResult(): StoredLookResult | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  return parseStoredLook(raw);
}

export function loadLookHistory(): StoredLookResult[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = localStorage.getItem(HISTORY_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((entry) => Boolean(entry) && typeof entry === "object")
      .map((entry) => addTimestamp(entry as StoredLookResult))
      .slice(0, MAX_HISTORY_ITEMS);
  } catch {
    return [];
  }
}
