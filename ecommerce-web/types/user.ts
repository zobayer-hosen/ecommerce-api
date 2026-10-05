export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: "CUSTOMER" | "ADMIN";
  is_active: boolean;
  created_at: string;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface AdminUpdateUserRequest {
  role?: "CUSTOMER" | "ADMIN";
  is_active?: boolean;
}
