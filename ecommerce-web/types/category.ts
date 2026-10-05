export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  product_count: number;
  created_at: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
}
