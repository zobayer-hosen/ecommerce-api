"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { CartSummary } from "@/components/cart/CartSummary";
import { EmptyState } from "@/components/ui/EmptyState";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ShoppingCart, ArrowLeft, ArrowRight } from "lucide-react";

export default function CartPage() {
  const { cart, isLoading, updateItem, removeItem, clearCart } = useCart();
  const { isAuthenticated, isAdmin } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  if (isAdmin) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <Alert variant="info" title="Administrator Account">
          Shopping carts are only available for customer accounts.
        </Alert>
        <Link href="/admin" className="inline-block mt-4">
          <Button>Go to Admin Dashboard</Button>
        </Link>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
          <ShoppingCart className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Your Cart is Waiting</h2>
        <p className="text-sm text-slate-500 mt-2 mb-6">
          Sign in to view your saved items, synchronize your cart, and proceed to checkout.
        </p>
        <Link href="/login?redirect=/cart">
          <Button size="lg" className="w-full">
            Sign In to Continue
          </Button>
        </Link>
      </div>
    );
  }

  const handleUpdateQuantity = async (itemId: number, quantity: number) => {
    setErrorMsg(null);
    try {
      await updateItem(itemId, quantity);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to update item quantity");
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    setErrorMsg(null);
    try {
      await removeItem(itemId);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to remove item");
    }
  };

  const handleClearCart = async () => {
    if (!confirm("Are you sure you want to remove all items from your cart?")) return;
    setIsClearing(true);
    setErrorMsg(null);
    try {
      await clearCart();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to clear cart");
    } finally {
      setIsClearing(false);
    }
  };

  const items = cart?.items || [];
  const isEmpty = items.length === 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Title & Continue Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Shopping Cart</h1>
          <p className="text-sm text-slate-500 mt-1">
            {cart ? `${cart.total_quantity} item(s) currently in your cart` : "Review your chosen items"}
          </p>
        </div>

        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Continue Shopping</span>
        </Link>
      </div>

      {errorMsg && (
        <Alert variant="error" className="mb-6" onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      )}

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
          Loading your cart items...
        </div>
      ) : isEmpty ? (
        <EmptyState
          icon={<ShoppingCart className="w-8 h-8 text-slate-400" />}
          title="Your shopping cart is empty"
          description="Looks like you haven't added anything to your cart yet. Explore our products and discover great deals today!"
          action={
            <Link href="/products">
              <Button size="lg" className="gap-2">
                <span>Start Shopping</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Items List */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="hidden sm:flex items-center justify-between pb-3 border-b border-slate-100 text-xs font-semibold uppercase text-slate-400">
              <span>Product Details</span>
              <div className="flex items-center gap-14">
                <span>Quantity</span>
                <span>Total</span>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {items.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  currency={cart?.currency || "BDT"}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemove={handleRemoveItem}
                />
              ))}
            </div>
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <CartSummary
              subtotal={cart?.subtotal || 0}
              totalQuantity={cart?.total_quantity || 0}
              currency={cart?.currency || "BDT"}
              onClearCart={handleClearCart}
              isClearing={isClearing}
            />
          </div>
        </div>
      )}
    </div>
  );
}
