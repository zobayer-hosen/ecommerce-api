import { OrderStatus } from "@/lib/constants";

export interface ShippingAddress {
  full_name: string;
  phone: string;
  line1: string;
  city: string;
  postal_code: string;
  country: string;
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface OrderStatusHistory {
  id: number;
  from_status?: string;
  to_status: string;
  changed_by?: number;
  note?: string;
  created_at: string;
}

export interface Order {
  id: number;
  order_number: string;
  user_id: number;
  status: OrderStatus;
  subtotal: number;
  shipping_fee: number;
  total_amount: number;
  currency: string;
  shipping_address: ShippingAddress;
  note?: string;
  placed_at: string;
  created_at: string;
  items?: OrderItem[];
  status_history?: OrderStatusHistory[];
}

export interface CheckoutRequest {
  shipping_address: ShippingAddress;
  note?: string;
}

export interface ChangeOrderStatusRequest {
  status: OrderStatus;
  note?: string;
}

export interface OrderFilter {
  user_id?: number;
  status?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}
