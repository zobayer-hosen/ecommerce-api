import { apiClient } from "./api.client";
import { ApiResponse } from "@/types/api";
import { DashboardStats } from "@/types/dashboard";

export const dashboardService = {
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await apiClient.get<ApiResponse<DashboardStats>>("/admin/dashboard");
    return res.data.data;
  },
};
