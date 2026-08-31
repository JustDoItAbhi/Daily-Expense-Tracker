import { apiClient } from "../apiClient";
import { User } from "@/src/types";

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalDevices: number;
}

export const adminApi = {
  async listUsers(): Promise<User[]> {
    const { data } = await apiClient.get<User[]>("/api/v1/admin/users");
    return data;
  },
  async setUserActive(userId: string, active: boolean): Promise<User> {
    const { data } = await apiClient.patch<User>(`/api/v1/admin/users/${userId}`, { active });
    return data;
  },
  async stats(): Promise<AdminStats> {
    const { data } = await apiClient.get<AdminStats>("/api/v1/admin/stats");
    return data;
  },
};
