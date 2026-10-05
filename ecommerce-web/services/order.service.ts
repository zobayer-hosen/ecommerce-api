import { apiClient } from "./api.client";
import { ApiListResponse, ApiResponse } from "@/types/api";
import { CheckoutRequest, Order, OrderFilter } from "@/types/order";

export const orderService = {
  async checkout(data: CheckoutRequest, idempotencyKey?: string): Promise<Order> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers["Idempotency-Key"] = idempotencyKey;
    }
    const res = await apiClient.post<ApiResponse<Order>>("/orders", data, { headers });
    return res.data.data;
  },

  async getMyOrders(filter: OrderFilter = {}): Promise<ApiListResponse<Order>> {
    const params: Record<string, unknown> = {};
    if (filter.status) params.status = filter.status;
    if (filter.page) params.page = filter.page;
    if (filter.limit) params.limit = filter.limit;

    const res = await apiClient.get<ApiListResponse<Order>>("/orders", { params });
    return res.data;
  },

  async getMyOrderDetail(id: number): Promise<Order> {
    const res = await apiClient.get<ApiResponse<Order>>(`/orders/${id}`);
    return res.data.data;
  },

  async cancelMyOrder(id: number): Promise<Order> {
    const res = await apiClient.post<ApiResponse<Order>>(`/orders/${id}/cancel`);
    return res.data.data;
  },
};
