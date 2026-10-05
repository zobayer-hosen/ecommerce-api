"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/product.service";
import { categoryService } from "@/services/category.service";
import { ProductFilter } from "@/types/product";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductFilters } from "@/components/product/ProductFilters";
import { Pagination } from "@/components/ui/Pagination";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { getErrorMessage } from "@/services/api.client";

function ProductsContent() {
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<ProductFilter>({
    page: 1,
    limit: 12,
    sort: "newest",
    search: searchParams.get("search") || undefined,
    category_id: searchParams.get("category_id") ? Number(searchParams.get("category_id")) : undefined,
    in_stock: searchParams.get("in_stock") === "true" ? true : undefined,
  });

  // Sync url search param changes
  useEffect(() => {
    const s = searchParams.get("search");
    const cat = searchParams.get("category_id");
    const instock = searchParams.get("in_stock");

    setFilters((prev) => ({
      ...prev,
      search: s || undefined,
      category_id: cat ? Number(cat) : undefined,
      in_stock: instock === "true" ? true : undefined,
      page: 1,
    }));
  }, [searchParams]);

  // Fetch categories for filter dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryService.getCategories(),
  });

  // Fetch products with current filters
  const {
    data: productsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["products", filters],
    queryFn: () => productService.getProducts(filters),
  });

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 12,
      sort: "newest",
      search: undefined,
      category_id: undefined,
      min_price: undefined,
      max_price: undefined,
      in_stock: undefined,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Browse Products</h1>
        <p className="text-sm text-slate-500 mt-1">
          {productsResponse?.meta ? `Showing ${productsResponse.meta.total} products in catalog` : "Explore our catalog"}
        </p>
      </div>

      {/* Filter Component */}
      <ProductFilters
        categories={categories}
        filters={filters}
        onFilterChange={setFilters}
        onReset={handleResetFilters}
      />

      {/* Error State */}
      {error && (
        <Alert variant="error" title="Failed to load products" className="mb-6">
          <p>{getErrorMessage(error)}</p>
          <button
            onClick={() => refetch()}
            className="mt-2 text-xs font-semibold text-rose-700 underline hover:no-underline"
          >
            Try Again
          </button>
        </Alert>
      )}

      {/* Product Grid */}
      <ProductGrid
        products={productsResponse?.data || []}
        isLoading={isLoading}
        emptyTitle="No products match your criteria"
        emptyDescription="Try clearing some filters or searching with a different keyword."
        emptyAction={
          <button
            onClick={handleResetFilters}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline"
          >
            Clear all filters
          </button>
        }
      />

      {/* Pagination */}
      {productsResponse?.meta && productsResponse.meta.total_pages > 1 && (
        <div className="mt-12 flex justify-center">
          <Pagination
            currentPage={productsResponse.meta.page}
            totalPages={productsResponse.meta.total_pages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-80 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
