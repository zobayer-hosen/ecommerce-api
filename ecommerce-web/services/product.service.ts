import { apiClient } from "./api.client";
import { ApiListResponse, ApiResponse } from "@/types/api";
import { Product, ProductFilter } from "@/types/product";

export const productService = {
  async getProducts(filter: ProductFilter = {}): Promise<ApiListResponse<Product>> {
    const params: Record<string, unknown> = {};

    if (filter.search) params.search = filter.search;
    if (filter.category_id) params.category_id = filter.category_id;
    if (filter.min_price !== undefined) params.min_price = filter.min_price;
    if (filter.max_price !== undefined) params.max_price = filter.max_price;
    if (filter.in_stock !== undefined) params.in_stock = filter.in_stock;
    if (filter.status) params.status = filter.status;
    if (filter.sort) params.sort = filter.sort;
    if (filter.page) params.page = filter.page;
    if (filter.limit) params.limit = filter.limit;

    const res = await apiClient.get<ApiListResponse<Product>>("/products", { params });
    return res.data;
  },

  async getProductByIdOrSlug(idOrSlug: string | number): Promise<Product> {
    const res = await apiClient.get<ApiResponse<Product>>(`/products/${idOrSlug}`);
    return res.data.data;
  },
};
