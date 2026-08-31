/**
 * Secure storage boundary for session secrets (JWT access + refresh tokens).
 *
 * Native: hardware-backed SecureStore (Keychain / EncryptedSharedPreferences).
 * Web: SecureStore is unavailable, so we fall back to AsyncStorage-backed KV.
 * Tokens are never placed in plain AsyncStorage on native.
 */
import { Platform } from "react-native";
import { storage } from "@/src/utils/storage";

const IS_WEB = Platform.OS === "web";

const ACCESS = "auth.accessToken";
const REFRESH = "auth.refreshToken";

async function getSecret(key: string): Promise<string | null> {
  return IS_WEB ? storage.getItem(key, null as string | null) : storage.secureGet(key, null as string | null);
}
async function setSecret(key: string, value: string): Promise<void> {
  if (IS_WEB) await storage.setItem(key, value);
  else await storage.secureSet(key, value);
}
async function removeSecret(key: string): Promise<void> {
  if (IS_WEB) await storage.removeItem(key);
  else await storage.secureRemove(key);
}

export const secureStorage = {
  getAccessToken: () => getSecret(ACCESS),
  setAccessToken: (t: string) => setSecret(ACCESS, t),
  getRefreshToken: () => getSecret(REFRESH),
  setRefreshToken: (t: string) => setSecret(REFRESH, t),
  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await setSecret(ACCESS, accessToken);
    await setSecret(REFRESH, refreshToken);
  },
  async clear(): Promise<void> {
    await removeSecret(ACCESS);
    await removeSecret(REFRESH);
  },
};
