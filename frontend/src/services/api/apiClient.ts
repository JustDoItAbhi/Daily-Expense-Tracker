/**
 * Single Axios client for the whole app.
 *
 * Responsibilities: base URL, Bearer injection, and transparent 401 handling
 * via single-flight refresh-token rotation. Business code never builds its own
 * HTTP requests or duplicates token logic.
 *
 * The base URL comes from EXPO_PUBLIC_BACKEND_URL; all endpoints live under
 * /api/v1/* (reached through the /api ingress prefix). The frontend has no
 * knowledge of whether the backend is FastAPI or Spring Boot.
 */
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { secureStorage } from "@/src/storage/secureStorage";

export const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? "";

export const apiClient = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });

let refreshing: Promise<string | null> | null = null;

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await secureStorage.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    const url = original?.url ?? "";
    if (
      status !== 401 ||
      !original ||
      original._retry ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/login") ||
      url.includes("/auth/register")
    ) {
      return Promise.reject(error);
    }
    original._retry = true;

    refreshing =
      refreshing ??
      (async () => {
        const rt = await secureStorage.getRefreshToken();
        if (!rt) return null;
        try {
          const res = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, { refreshToken: rt });
          await secureStorage.setTokens(res.data.accessToken, res.data.refreshToken);
          return res.data.accessToken as string;
        } catch {
          await secureStorage.clear();
          return null;
        } finally {
          refreshing = null;
        }
      })();

    const newToken = await refreshing;
    if (!newToken) return Promise.reject(error);
    original.headers.Authorization = `Bearer ${newToken}`;
    return apiClient(original);
  },
);
