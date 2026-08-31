import * as Crypto from "expo-crypto";

/**
 * Collision-safe identifier generation.
 *
 * We deliberately DO NOT use timestamp-only ids (e.g. `e_${Date.now()}`) because
 * they collide under rapid creation and are not safe for multi-device sync.
 *
 * `newId(prefix)` returns a UUIDv4, optionally prefixed for readability/debugging.
 * The prefix has no semantic meaning for uniqueness — the UUID guarantees that.
 */
export function uuid(): string {
  return Crypto.randomUUID();
}

export function newId(prefix?: string): string {
  const id = Crypto.randomUUID();
  return prefix ? `${prefix}_${id}` : id;
}
