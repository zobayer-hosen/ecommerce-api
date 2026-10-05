import React from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Trash2 } from "lucide-react";

export interface CartSummaryProps {
  subtotal: number;
  totalQuantity: number;
  currency?: string;
  shippingFee?: number;
  onClearCart?: () => void;
  isClearing?: boolean;
}

export function CartSummary({
  subtotal,
  totalQuantity,
  currency = "BDT",
  shippingFee = 0,
  onClearCart,
  isClearing,
}: CartSummaryProps) {
  const total = subtotal + shippingFee;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs sticky top-24">
      <h3 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3 mb-4">
        Order Summary
      </h3>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between text-slate-600">
          <span>Items ({totalQuantity}):</span>
          <span className="font-medium text-slate-900">{formatPrice(subtotal, currency)}</span>
        </div>

        <div className="flex justify-between text-slate-600">
          <span>Estimated Shipping:</span>
          <span className="font-medium text-slate-900">
            {shippingFee === 0 ? "Free" : formatPrice(shippingFee, currency)}
          </span>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
          <span className="text-base font-bold text-slate-900">Total:</span>
          <span className="text-xl font-bold text-indigo-600">{formatPrice(total, currency)}</span>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <Link href="/checkout" className="block w-full">
          <Button size="lg" className="w-full gap-2">
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>

        {onClearCart && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearCart}
            isLoading={isClearing}
            className="w-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-xs"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Clear shopping cart
          </Button>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        Taxes calculated at checkout. Stock verified in real time.
      </p>
    </div>
  );
}
