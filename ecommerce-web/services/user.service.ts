import { apiClient } from "./api.client";
import { ApiResponse } from "@/types/api";
import { ChangePasswordRequest, UpdateProfileRequest, User } from "@/types/user";

export const userService = {
  async getProfile(): Promise<User> {
    const res = await apiClient.get<ApiResponse<User>>("/users/me");
    return res.data.data;
  },

  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    const res = await apiClient.patch<ApiResponse<User>>("/users/me", data);
    return res.data.data;
  },

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await apiClient.put("/users/me/password", data);
  },
};
