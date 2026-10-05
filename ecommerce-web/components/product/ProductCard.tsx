"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Product } from "@/types/product";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { ShoppingCart, Check, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { isAdmin } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isOutOfStock = product.stock_quantity <= 0;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock || isAdding || isAdmin) return;

    setIsAdding(true);
    setErrorMsg(null);
    try {
      await addItem(product.id, 1);
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 2000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to add to cart");
      setTimeout(() => setErrorMsg(null), 3000);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="group relative bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col h-full">
      {/* Product Image Link */}
      <Link
        href={`/products/${product.slug || product.id}`}
        className="block relative aspect-square bg-slate-50 overflow-hidden"
      >
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-100">
            <ShoppingCart className="w-12 h-12 stroke-[1.2]" />
            <span className="text-xs text-slate-400 mt-2">No image</span>
          </div>
        )}

        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {product.category && (
            <Badge variant="default" className="bg-white/90 backdrop-blur-sm shadow-xs text-[11px]">
              {product.category.name}
            </Badge>
          )}
          {isOutOfStock ? (
            <Badge variant="danger" className="shadow-xs font-semibold">
              Out of Stock
            </Badge>
          ) : isLowStock ? (
            <Badge variant="warning" className="shadow-xs font-semibold">
              Only {product.stock_quantity} left
            </Badge>
          ) : null}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <Link href={`/products/${product.slug || product.id}`} className="block flex-1">
          <h3 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug mb-1">
            {product.name}
          </h3>
          <p className="text-xs text-slate-500 mb-3">SKU: {product.sku}</p>
        </Link>

        {/* Price & Action */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
          <div>
            <p className="text-xs text-slate-400 font-medium">Price</p>
            <p className="text-base font-bold text-slate-900">{formatPrice(product.price, product.currency)}</p>
          </div>

          {!isAdmin && (
            <Button
              size="sm"
              variant={isSuccess ? "secondary" : "primary"}
              disabled={isOutOfStock}
              isLoading={isAdding}
              onClick={handleAddToCart}
              className={isSuccess ? "bg-emerald-600 hover:bg-emerald-700" : ""}
              title={isOutOfStock ? "Product is out of stock" : "Add to cart"}
            >
              {isSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span className="hidden sm:inline">Added</span>
                </>
              ) : isOutOfStock ? (
                "Sold Out"
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  <span className="hidden sm:inline">Add</span>
                </>
              )}
            </Button>
          )}
        </div>

        {errorMsg && (
          <div className="mt-2 text-xs text-rose-600 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{errorMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
}
