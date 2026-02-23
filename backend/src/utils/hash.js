import { createHash } from "crypto";

export function hashBufferToIndex(buffer, salt, max) {
  const hash = createHash("sha256").update(buffer).update(salt).digest("hex");
  const value = Number.parseInt(hash.slice(0, 8), 16);
  return value % max;
}

export function hashTextToIndex(text, max) {
  const hash = createHash("sha256").update(text).digest("hex");
  const value = Number.parseInt(hash.slice(0, 8), 16);
  return value % max;
}
