"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/product.service";
import { categoryService } from "@/services/category.service";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Button } from "@/components/ui/Button";
import { ArrowRight, ShoppingBag, Sparkles, ShieldCheck, Zap } from "lucide-react";

export default function HomePage() {
  const { data: featuredData, isLoading: isFeaturedLoading } = useQuery({
    queryKey: ["featured-products"],
    queryFn: () => productService.getProducts({ limit: 4, sort: "newest" }),
  });

  const { data: popularData, isLoading: isPopularLoading } = useQuery({
    queryKey: ["popular-products"],
    queryFn: () => productService.getProducts({ limit: 8, in_stock: true }),
  });

  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["homepage-categories"],
    queryFn: () => categoryService.getCategories(),
  });

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white py-16 sm:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Gen E-Commerce Experience</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Discover Quality Products At Great Prices.
            </h1>

            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-slate-300 leading-relaxed">
              Explore our curated selection of verified electronics, fashion, and accessories.
              Instant checkout, real-time inventory, and lightning fast delivery.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/products">
                <Button size="lg" className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/25">
                  Browse Catalog
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/categories">
                <Button size="lg" variant="outline" className="border-slate-700 bg-slate-800/60 text-white hover:bg-slate-800">
                  All Categories
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Shop by Category</h2>
            <p className="text-sm text-slate-500 mt-1">Browse collections tailored to your lifestyle</p>
          </div>
          <Link href="/categories" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isCategoriesLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories?.slice(0, 6).map((category) => (
              <Link
                key={category.id}
                href={`/products?category_id=${category.id}`}
                className="group p-5 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-md transition-all text-center flex flex-col items-center justify-center"
              >
                <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 line-clamp-1">
                  {category.name}
                </h4>
                <span className="text-xs text-slate-400 mt-1">{category.product_count} products</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
              <Zap className="w-3.5 h-3.5" />
              <span>Fresh Arrivals</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Featured Products</h2>
          </div>
          <Link href="/products?sort=newest" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
            <span>Explore More</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <ProductGrid
          products={featuredData?.data || []}
          isLoading={isFeaturedLoading}
        />
      </section>

      {/* Promotional Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-indigo-600 text-white p-8 sm:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl z-10">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Enjoy Seamless Shopping with Guaranteed Stock
            </h3>
            <p className="mt-3 text-indigo-100 text-sm sm:text-base leading-relaxed">
              Every checkout is locked and verified with real-time atomic inventory updates. Never worry about overselling or cancellation surprises.
            </p>
            <div className="mt-6 flex items-center gap-4 text-xs font-semibold text-indigo-200">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Live Inventory Check
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Secure Payments
              </span>
            </div>
          </div>
          <div className="z-10 shrink-0">
            <Link href="/products">
              <Button size="lg" className="bg-white text-indigo-700 hover:bg-slate-100 shadow-md font-bold">
                Start Shopping Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Popular Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Popular In Stock</h2>
            <p className="text-sm text-slate-500 mt-1">Ready to ship directly to your doorstep</p>
          </div>
          <Link href="/products?in_stock=true" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
            <span>View All In Stock</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <ProductGrid
          products={popularData?.data || []}
          isLoading={isPopularLoading}
        />
      </section>
    </div>
  );
}
