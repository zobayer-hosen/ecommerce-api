"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { categoryService } from "@/services/category.service";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Alert } from "@/components/ui/Alert";
import { getErrorMessage } from "@/services/api.client";
import { ShoppingBag, ArrowRight } from "lucide-react";

export default function CategoriesPage() {
  const { data: categories, isLoading, error } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryService.getCategories(),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Product Categories</h1>
        <p className="text-sm text-slate-500 mt-1">Browse our full range of product departments</p>
      </div>

      {error && (
        <Alert variant="error" title="Failed to load categories" className="mb-6">
          {getErrorMessage(error)}
        </Alert>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
              <Skeleton className="w-12 h-12 rounded-full" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      ) : categories && categories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category_id=${category.id}`}
              className="group bg-white rounded-xl border border-slate-200 p-6 hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {category.name}
                </h3>
                <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                  {category.description || "Discover the latest products in this category."}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-400">{category.product_count} Products</span>
                <span className="text-indigo-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Shop Now
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No categories found"
          description="There are currently no categories available in the store."
        />
      )}
    </div>
  );
}
