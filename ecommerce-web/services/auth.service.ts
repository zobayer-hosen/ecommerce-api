import { apiClient, tokenStorage } from "./api.client";
import { ApiResponse } from "@/types/api";
import { LoginRequest, LogoutRequest, RegisterRequest, TokenResponse } from "@/types/auth";
import { User } from "@/types/user";

export const authService = {
  async register(data: RegisterRequest): Promise<User> {
    const res = await apiClient.post<ApiResponse<User>>("/auth/register", data);
    return res.data.data;
  },

  async login(data: LoginRequest): Promise<TokenResponse> {
    const res = await apiClient.post<ApiResponse<TokenResponse>>("/auth/login", data);
    const tokens = res.data.data;
    tokenStorage.setTokens(tokens.access_token, tokens.refresh_token);
    return tokens;
  },

  async logout(): Promise<void> {
    const refreshToken = tokenStorage.getRefreshToken();
    if (refreshToken) {
      try {
        await apiClient.post("/auth/logout", { refresh_token: refreshToken } as LogoutRequest);
      } catch {
        // Ignore failure on server logout
      }
    }
    tokenStorage.clearTokens();
  },

  isAuthenticated(): boolean {
    return !!tokenStorage.getAccessToken();
  },
};
