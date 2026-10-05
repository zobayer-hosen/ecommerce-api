"use client";

import React, { useState } from "react";
import { Category } from "@/types/category";
import { ProductFilter } from "@/types/product";
import { SORT_OPTIONS } from "@/lib/constants";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Filter, RotateCcw, Search } from "lucide-react";

export interface ProductFiltersProps {
  categories: Category[];
  filters: ProductFilter;
  onFilterChange: (newFilters: ProductFilter) => void;
  onReset: () => void;
}

export function ProductFilters({ categories, filters, onFilterChange, onReset }: ProductFiltersProps) {
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: `${c.name} (${c.product_count})`,
  }));

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value, page: 1 });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value ? Number(e.target.value) : undefined;
    onFilterChange({ ...filters, category_id: val, page: 1 });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, sort: e.target.value || undefined, page: 1 });
  };

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Input is in standard currency units (e.g. 100 BDT = 10000 minor units)
    const val = e.target.value ? Math.round(Number(e.target.value) * 100) : undefined;
    onFilterChange({ ...filters, min_price: val, page: 1 });
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value ? Math.round(Number(e.target.value) * 100) : undefined;
    onFilterChange({ ...filters, max_price: val, page: 1 });
  };

  const handleInStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, in_stock: e.target.checked ? true : undefined, page: 1 });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 mb-6 shadow-xs">
      <div className="flex items-center justify-between lg:hidden mb-3">
        <button
          onClick={() => setIsOpenMobile(!isOpenMobile)}
          className="flex items-center gap-2 text-sm font-semibold text-slate-800"
        >
          <Filter className="w-4 h-4 text-indigo-600" />
          <span>{isOpenMobile ? "Hide Filters" : "Show Filters & Search"}</span>
        </button>

        <Button variant="ghost" size="sm" onClick={onReset} className="text-xs">
          <RotateCcw className="w-3.5 h-3.5 mr-1" />
          Reset
        </Button>
      </div>

      <div className={`${isOpenMobile ? "block" : "hidden"} lg:block space-y-4`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Input
              label="Search"
              placeholder="Search products..."
              value={filters.search || ""}
              onChange={handleSearchChange}
              className="pl-9"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-8" />
          </div>

          {/* Category */}
          <Select
            label="Category"
            placeholder="All Categories"
            options={categoryOptions}
            value={filters.category_id || ""}
            onChange={handleCategoryChange}
          />

          {/* Sort */}
          <Select
            label="Sort By"
            options={SORT_OPTIONS}
            value={filters.sort || "newest"}
            onChange={handleSortChange}
          />

          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Price Range (BDT)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                min="0"
                value={filters.min_price !== undefined ? filters.min_price / 100 : ""}
                onChange={handleMinPriceChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-slate-400">-</span>
              <input
                type="number"
                placeholder="Max"
                min="0"
                value={filters.max_price !== undefined ? filters.max_price / 100 : ""}
                onChange={handleMaxPriceChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Bottom Filter Controls */}
        <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-100 gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 select-none">
            <input
              type="checkbox"
              checked={!!filters.in_stock}
              onChange={handleInStockChange}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
            />
            <span>In-stock items only</span>
          </label>

          <Button variant="ghost" size="sm" onClick={onReset} className="hidden lg:inline-flex text-xs text-slate-500">
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Clear all filters
          </Button>
        </div>
      </div>
    </div>
  );
}
