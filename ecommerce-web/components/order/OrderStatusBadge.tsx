import React from "react";
import { OrderStatus, ORDER_STATUS_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface OrderStatusBadgeProps {
  status: OrderStatus | string;
  className?: string;
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const normalized = (status?.toUpperCase() || "PENDING") as OrderStatus;
  const config = ORDER_STATUS_COLORS[normalized] || {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border tracking-wide uppercase",
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      {status}
    </span>
  );
}
