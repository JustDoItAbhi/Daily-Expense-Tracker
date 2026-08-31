/**
 * Non-sensitive preferences (AsyncStorage-backed via the shared singleton).
 *
 * Holds: device id (non-secret installation identifier), theme mode,
 * and seed control flags. NEVER holds passwords, tokens, or secrets.
 */
import { storage } from "@/src/utils/storage";
import { newId } from "@/src/utils/id";

const KEYS = {
  deviceId: "pref.deviceId",
  seedEnabled: "pref.seedEnabled",
  seedDone: "pref.seedDone",
} as const;

export const preferencesStorage = {
  /** Stable per-installation device id. Generated once and reused. */
  async getDeviceId(): Promise<string> {
    const existing = await storage.getItem<string | null>(KEYS.deviceId, null);
    if (existing) return existing;
    const id = newId("dev");
    await storage.setItem(KEYS.deviceId, id);
    return id;
  },

  /** Whether demo/seed data may be loaded into an empty DB. Defaults to true. */
  async isSeedEnabled(): Promise<boolean> {
    const v = await storage.getItem<boolean>(KEYS.seedEnabled, true);
    return v !== false;
  },
  async setSeedEnabled(enabled: boolean): Promise<void> {
    await storage.setItem(KEYS.seedEnabled, enabled);
  },

  async isSeedDone(): Promise<boolean> {
    const v = await storage.getItem<boolean>(KEYS.seedDone, false);
    return v === true;
  },
  async setSeedDone(done: boolean): Promise<void> {
    await storage.setItem(KEYS.seedDone, done);
  },
};
