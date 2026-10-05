"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { formatPrice } from "@/lib/utils";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, ShoppingCart } from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, isLoading: isCartLoading } = useCart();
  const { isAuthenticated, isLoading: isAuthLoading, isAdmin } = useAuth();

  React.useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/login?redirect=/checkout");
    }
  }, [isAuthLoading, isAuthenticated, router]);

  if (isAuthLoading || isCartLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-500">
        Loading checkout details...
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <Alert variant="info" title="Administrator Account">
          Admins cannot place customer orders.
        </Alert>
        <Link href="/admin" className="inline-block mt-4">
          <Button>Go to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const items = cart?.items || [];
  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
          <ShoppingCart className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Your Cart is Empty</h2>
        <p className="text-sm text-slate-500 mt-2 mb-6">
          You must have at least one item in your shopping cart to proceed with checkout.
        </p>
        <Link href="/products">
          <Button size="lg">Explore Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex items-center gap-2 mb-6 text-sm text-slate-500">
        <Link href="/cart" className="inline-flex items-center gap-1 hover:text-indigo-600 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Shopping Cart</span>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Checkout</h1>
        <p className="text-sm text-slate-500 mt-1">Review your order details and specify shipping address</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Shipping Form (7 cols) */}
        <div className="lg:col-span-7">
          <CheckoutForm />
        </div>

        {/* Right Side: Order Items & Subtotal Preview (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 shadow-xs sticky top-24">
          <h3 className="text-base font-semibold text-slate-900 pb-3 border-b border-slate-100 mb-4">
            Items in Your Order ({cart?.total_quantity})
          </h3>

          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1 space-y-2 mb-4">
            {items.map((item) => (
              <div key={item.id} className="pt-2 first:pt-0 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">
                        Item
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 text-xs truncate">{item.product_name}</p>
                    <p className="text-[11px] text-slate-500">
                      Qty: {item.quantity} × {formatPrice(item.price, cart?.currency)}
                    </p>
                  </div>
                </div>

                <span className="font-bold text-slate-900 text-xs shrink-0">
                  {formatPrice(item.line_total, cart?.currency)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2.5 pt-4 border-t border-slate-100 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-medium text-slate-900">
                {formatPrice(cart?.subtotal || 0, cart?.currency)}
              </span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Shipping:</span>
              <span className="font-medium text-slate-900">Free</span>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
              <span className="text-base font-bold text-slate-900">Order Total:</span>
              <span className="text-xl font-bold text-indigo-600">
                {formatPrice(cart?.subtotal || 0, cart?.currency)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
