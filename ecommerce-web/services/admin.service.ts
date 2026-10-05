import { apiClient } from "./api.client";
import { ApiListResponse, ApiResponse } from "@/types/api";
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from "@/types/category";
import {
  AdjustStockRequest,
  CreateProductRequest,
  Product,
  UpdateProductRequest,
} from "@/types/product";
import { ChangeOrderStatusRequest, Order, OrderFilter } from "@/types/order";
import { AdminUpdateUserRequest, User } from "@/types/user";

export const adminService = {
  // Categories
  async createCategory(data: CreateCategoryRequest): Promise<Category> {
    const res = await apiClient.post<ApiResponse<Category>>("/admin/categories", data);
    return res.data.data;
  },

  async updateCategory(id: number, data: UpdateCategoryRequest): Promise<Category> {
    const res = await apiClient.patch<ApiResponse<Category>>(`/admin/categories/${id}`, data);
    return res.data.data;
  },

  async deleteCategory(id: number): Promise<void> {
    await apiClient.delete(`/admin/categories/${id}`);
  },

  // Products
  async createProduct(data: CreateProductRequest): Promise<Product> {
    const res = await apiClient.post<ApiResponse<Product>>("/admin/products", data);
    return res.data.data;
  },

  async updateProduct(id: number, data: UpdateProductRequest): Promise<Product> {
    const res = await apiClient.patch<ApiResponse<Product>>(`/admin/products/${id}`, data);
    return res.data.data;
  },

  async deleteProduct(id: number): Promise<void> {
    await apiClient.delete(`/admin/products/${id}`);
  },

  async adjustStock(productId: number, data: AdjustStockRequest): Promise<Product> {
    const res = await apiClient.post<ApiResponse<Product>>(`/admin/products/${productId}/stock`, data);
    return res.data.data;
  },

  async getLowStockProducts(threshold = 5, page = 1, limit = 20): Promise<ApiListResponse<Product>> {
    const res = await apiClient.get<ApiListResponse<Product>>("/admin/products/low-stock", {
      params: { threshold, page, limit },
    });
    return res.data;
  },

  // Orders
  async getOrders(filter: OrderFilter = {}): Promise<ApiListResponse<Order>> {
    const params: Record<string, unknown> = {};
    if (filter.user_id) params.user_id = filter.user_id;
    if (filter.status) params.status = filter.status;
    if (filter.start_date) params.start_date = filter.start_date;
    if (filter.end_date) params.end_date = filter.end_date;
    if (filter.page) params.page = filter.page;
    if (filter.limit) params.limit = filter.limit;

    const res = await apiClient.get<ApiListResponse<Order>>("/admin/orders", { params });
    return res.data;
  },

  async getOrderDetail(id: number): Promise<Order> {
    const res = await apiClient.get<ApiResponse<Order>>(`/admin/orders/${id}`);
    return res.data.data;
  },

  async updateOrderStatus(id: number, data: ChangeOrderStatusRequest): Promise<Order> {
    const res = await apiClient.patch<ApiResponse<Order>>(`/admin/orders/${id}/status`, data);
    return res.data.data;
  },

  // Users
  async getUsers(page = 1, limit = 20, search?: string): Promise<ApiListResponse<User>> {
    const params: Record<string, unknown> = { page, limit };
    if (search) params.search = search;

    const res = await apiClient.get<ApiListResponse<User>>("/admin/users", { params });
    return res.data;
  },

  async updateUser(id: number, data: AdminUpdateUserRequest): Promise<User> {
    const res = await apiClient.patch<ApiResponse<User>>(`/admin/users/${id}`, data);
    return res.data.data;
  },
};
