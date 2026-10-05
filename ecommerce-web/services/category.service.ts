import { apiClient } from "./api.client";
import { ApiResponse } from "@/types/api";
import { Category } from "@/types/category";

export const categoryService = {
  async getCategories(): Promise<Category[]> {
    const res = await apiClient.get<ApiResponse<Category[]>>("/categories");
    return res.data.data;
  },

  async getCategoryById(id: number): Promise<Category> {
    const res = await apiClient.get<ApiResponse<Category>>(`/categories/${id}`);
    return res.data.data;
  },
};
