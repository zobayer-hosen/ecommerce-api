"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/product.service";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/utils";
import { getErrorMessage } from "@/services/api.client";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  ShoppingCart,
  ShieldCheck,
  Truck,
  ArrowLeft,
  Minus,
  Plus,
  Package,
} from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const idOrSlug = params.id as string;

  const { addItem } = useCart();
  const { isAdmin, isAuthenticated } = useAuth();

  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["product", idOrSlug],
    queryFn: () => productService.getProductByIdOrSlug(idOrSlug),
    enabled: !!idOrSlug,
  });

  const isOutOfStock = (product?.stock_quantity ?? 0) <= 0;
  const isLowStock = (product?.stock_quantity ?? 0) > 0 && (product?.stock_quantity ?? 0) <= 5;

  const handleAddToCart = async () => {
    if (!product || isOutOfStock || isAdding || isAdmin) return;

    if (!isAuthenticated) {
      router.push(`/login?redirect=/products/${idOrSlug}`);
      return;
    }

    setIsAdding(true);
    setErrorMsg(null);
    try {
      await addItem(product.id, quantity);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsAdding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Skeleton className="h-6 w-32 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <Alert variant="error" title="Product Not Found">
          {error ? getErrorMessage(error) : "The product you are looking for does not exist or is currently inactive."}
        </Alert>
        <Link href="/products" className="inline-block mt-6">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Products
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8">
        <Link href="/products" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          <span>All Products</span>
        </Link>
        {product.category && (
          <>
            <span>/</span>
            <Link
              href={`/products?category_id=${product.category.id}`}
              className="hover:text-indigo-600 transition-colors"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-slate-800 font-medium truncate max-w-[200px] sm:max-w-xs">{product.name}</span>
      </nav>

      {/* Product Detail Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
        {/* Left Column: Image */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center justify-center aspect-square overflow-hidden shadow-xs">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-contain max-h-[500px]"
            />
          ) : (
            <div className="text-center text-slate-300">
              <Package className="w-20 h-20 mx-auto stroke-1" />
              <p className="text-sm text-slate-400 mt-2">No product image available</p>
            </div>
          )}
        </div>

        {/* Right Column: Information & Actions */}
        <div className="flex flex-col">
          {/* Category & Status */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {product.category && (
              <Badge variant="default" className="text-xs">
                {product.category.name}
              </Badge>
            )}
            {isOutOfStock ? (
              <Badge variant="danger">Out of Stock</Badge>
            ) : isLowStock ? (
              <Badge variant="warning">Low Stock ({product.stock_quantity} left)</Badge>
            ) : (
              <Badge variant="success">In Stock ({product.stock_quantity} available)</Badge>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
            {product.name}
          </h1>

          <p className="text-xs font-mono text-slate-400 mt-1.5 mb-4">SKU: {product.sku}</p>

          {/* Price Box */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 mb-6">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Price</span>
            <div className="text-3xl font-extrabold text-indigo-600 mt-0.5">
              {formatPrice(product.price, product.currency)}
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">Description</h3>
            <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {product.description || "No description provided for this product."}
            </div>
          </div>

          {/* Quantity & Cart Action */}
          {!isAdmin && (
            <div className="pt-6 border-t border-slate-200 space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-slate-700">Quantity:</span>

                <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white">
                  <button
                    type="button"
                    disabled={quantity <= 1 || isOutOfStock}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <span className="w-12 text-center text-sm font-bold text-slate-800 select-none">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    disabled={quantity >= product.stock_quantity || isOutOfStock}
                    onClick={() => setQuantity((q) => Math.min(product.stock_quantity, q + 1))}
                    className="p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <span className="text-xs text-slate-400">
                  Max: {product.stock_quantity}
                </span>
              </div>

              {errorMsg && (
                <Alert variant="error" onClose={() => setErrorMsg(null)}>
                  {errorMsg}
                </Alert>
              )}

              {successMsg && (
                <Alert variant="success" onClose={() => setSuccessMsg(false)}>
                  Item successfully added to your cart!{" "}
                  <Link href="/cart" className="underline font-semibold ml-1">
                    View Cart
                  </Link>
                </Alert>
              )}

              <div className="flex gap-3">
                <Button
                  size="lg"
                  disabled={isOutOfStock}
                  isLoading={isAdding}
                  onClick={handleAddToCart}
                  className="flex-1 gap-2 text-base"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>{isOutOfStock ? "Out of Stock" : "Add to Cart"}</span>
                </Button>
              </div>
            </div>
          )}

          {isAdmin && (
            <div className="pt-6 border-t border-slate-200">
              <Alert variant="info" title="Admin View">
                You are viewing this product as an administrator. You can edit stock or details in the Admin Panel.
              </Alert>
              <Link href="/admin/products" className="inline-block mt-3">
                <Button variant="outline" size="sm">
                  Go to Product Management
                </Button>
              </Link>
            </div>
          )}

          {/* Delivery & Assurance Details */}
          <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-2 gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>Free standard delivery in Dhaka</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Authenticity guaranteed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
