import React from "react";
import Link from "next/link";
import { Order } from "@/types/order";
import { formatDate, formatPrice } from "@/lib/utils";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { ChevronRight, Package } from "lucide-react";

export interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-indigo-300 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Order</span>
          <h4 className="text-sm font-bold text-slate-900">{order.order_number}</h4>
        </div>

        <div className="flex items-center gap-3">
          <OrderStatusBadge status={order.status} />
          <span className="text-xs text-slate-500">{formatDate(order.created_at)}</span>
        </div>
      </div>

      {/* Items Preview */}
      <div className="py-3 text-sm text-slate-600">
        {order.items && order.items.length > 0 ? (
          <div className="space-y-1">
            {order.items.slice(0, 3).map((item) => (
              <div key={item.id} className="flex justify-between text-xs">
                <span className="truncate max-w-[250px] font-medium text-slate-800">
                  {item.quantity}x {item.product_name}
                </span>
                <span className="text-slate-600">{formatPrice(item.line_total, order.currency)}</span>
              </div>
            ))}
            {order.items.length > 3 && (
              <p className="text-xs text-slate-400 font-medium italic">
                + {order.items.length - 3} more item(s)
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Package className="w-3.5 h-3.5" />
            <span>Order placed</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-400">Total Amount</span>
          <p className="text-base font-bold text-indigo-600">
            {formatPrice(order.total_amount, order.currency)}
          </p>
        </div>

        <Link
          href={`/orders/${order.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <span>View Details</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
