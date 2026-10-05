export interface CartItem {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  price: number;
  quantity: number;
  line_total: number;
  image_url?: string;
}

export interface Cart {
  id: number;
  user_id: number;
  items: CartItem[];
  item_count: number;
  total_quantity: number;
  subtotal: number;
  currency: string;
}

export interface AddToCartRequest {
  product_id: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}
