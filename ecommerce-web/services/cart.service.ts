import { apiClient } from "./api.client";
import { ApiResponse } from "@/types/api";
import { AddToCartRequest, Cart, UpdateCartItemRequest } from "@/types/cart";

export const cartService = {
  async getCart(): Promise<Cart> {
    const res = await apiClient.get<ApiResponse<Cart>>("/cart");
    return res.data.data;
  },

  async addItem(data: AddToCartRequest): Promise<Cart> {
    const res = await apiClient.post<ApiResponse<Cart>>("/cart/items", data);
    return res.data.data;
  },

  async updateItem(itemId: number, data: UpdateCartItemRequest): Promise<Cart> {
    const res = await apiClient.patch<ApiResponse<Cart>>(`/cart/items/${itemId}`, data);
    return res.data.data;
  },

  async removeItem(itemId: number): Promise<void> {
    await apiClient.delete(`/cart/items/${itemId}`);
  },

  async clearCart(): Promise<void> {
    await apiClient.delete("/cart");
  },
};
