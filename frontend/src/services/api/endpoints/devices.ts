import { apiClient } from "../apiClient";

export const deviceApi = {
  async register(input: {
    deviceId: string;
    deviceName?: string;
    platform?: string;
    appVersion?: string;
    runtimeVersion?: string;
  }): Promise<void> {
    // Best-effort: device registration must never block the auth flow.
    try {
      await apiClient.post("/api/v1/devices", input);
    } catch {
      /* offline or transient — safe to retry on next login */
    }
  },
};
