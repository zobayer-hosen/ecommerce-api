"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CartItem } from "@/types/cart";
import { formatPrice } from "@/lib/utils";
import { Trash2, Plus, Minus, Loader2 } from "lucide-react";

export interface CartItemRowProps {
  item: CartItem;
  currency: string;
  onUpdateQuantity: (itemId: number, quantity: number) => Promise<void>;
  onRemove: (itemId: number) => Promise<void>;
}

export function CartItemRow({ item, currency, onUpdateQuantity, onRemove }: CartItemRowProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleQuantityChange = async (newQty: number) => {
    if (newQty < 1 || isUpdating) return;
    setIsUpdating(true);
    try {
      await onUpdateQuantity(item.id, newQty);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await onRemove(item.id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 border-b border-slate-200 gap-4 last:border-b-0">
      {/* Product Info */}
      <div className="flex items-center gap-3.5 flex-1 min-w-0">
        <div className="w-16 h-16 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
          {item.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">No img</div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <Link
            href={`/products/${item.product_id}`}
            className="text-sm font-semibold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-1"
          >
            {item.product_name}
          </Link>
          <p className="text-xs text-slate-500 mt-0.5">SKU: {item.sku}</p>
          <p className="text-xs font-medium text-slate-700 mt-1">
            Unit Price: {formatPrice(item.price, currency)}
          </p>
        </div>
      </div>

      {/* Controls & Line Total */}
      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
        {/* Quantity Controls */}
        <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white">
          <button
            type="button"
            disabled={item.quantity <= 1 || isUpdating}
            onClick={() => handleQuantityChange(item.quantity - 1)}
            className="p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            aria-label="Decrease quantity"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <span className="w-10 text-center text-sm font-semibold text-slate-800 select-none">
            {isUpdating ? <Loader2 className="w-3 h-3 animate-spin mx-auto text-indigo-600" /> : item.quantity}
          </span>

          <button
            type="button"
            disabled={isUpdating}
            onClick={() => handleQuantityChange(item.quantity + 1)}
            className="p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
            aria-label="Increase quantity"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Subtotal */}
        <div className="text-right min-w-[90px]">
          <p className="text-sm font-bold text-slate-900">{formatPrice(item.line_total, currency)}</p>
        </div>

        {/* Delete Action */}
        <button
          type="button"
          onClick={handleRemove}
          disabled={isDeleting}
          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          title="Remove from cart"
          aria-label="Remove item"
        >
          {isDeleting ? <Loader2 className="w-4 h-4 animate-spin text-rose-600" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
