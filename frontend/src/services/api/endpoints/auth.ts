import { apiClient, API_BASE_URL } from "../apiClient";
import { secureStorage } from "@/src/storage/secureStorage";
import { User } from "@/src/types";
import axios from "axios";

interface AuthPair {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export const authApi = {
  async login(email: string, password: string): Promise<User> {
    const { data } = await apiClient.post<AuthPair>("/api/v1/auth/login", { email, password });
    await secureStorage.setTokens(data.accessToken, data.refreshToken);
    return data.user;
  },

  async register(fullName: string, email: string, password: string): Promise<User> {
    const { data } = await apiClient.post<AuthPair>("/api/v1/auth/register", {
      fullName,
      email,
      password,
    });
    await secureStorage.setTokens(data.accessToken, data.refreshToken);
    return data.user;
  },

  async me(): Promise<User> {
    const { data } = await apiClient.get<User>("/api/v1/auth/me");
    return data;
  },

  async logout(): Promise<void> {
    const rt = await secureStorage.getRefreshToken();
    if (rt) {
      // Best-effort revoke; use a bare client so a 401 doesn't trigger refresh.
      try {
        await axios.post(`${API_BASE_URL}/api/v1/auth/logout`, { refreshToken: rt });
      } catch {
        /* offline logout is still valid locally */
      }
    }
    await secureStorage.clear();
  },

  async updateMe(patch: { fullName?: string; currency?: string; dailyLimit?: number }): Promise<User> {
    const { data } = await apiClient.patch<User>("/api/v1/users/me", patch);
    return data;
  },
};
