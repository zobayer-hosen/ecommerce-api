"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { productService } from "@/services/product.service";
import { adminService } from "@/services/admin.service";
import { Product } from "@/types/product";
import { getErrorMessage } from "@/services/api.client";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { Pagination } from "@/components/ui/Pagination";
import { Badge } from "@/components/ui/Badge";
import {
  AlertTriangle,
  ArrowUpDown,
  Search,
} from "lucide-react";

const adjustStockSchema = z.object({
  adjustment: z.coerce.number().refine((val) => val !== 0, "Adjustment cannot be 0"),
  reason: z.enum(["RESTOCK", "ADJUSTMENT"]),
});

type AdjustStockFormValues = z.infer<typeof adjustStockSchema>;

export default function AdminInventoryPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    data: productsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-inventory", page, lowStockOnly, search],
    queryFn: () => {
      if (lowStockOnly) {
        return adminService.getLowStockProducts(5, page, 10);
      }
      return productService.getProducts({
        page,
        limit: 10,
        search: search || undefined,
        sort: "newest",
      });
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdjustStockFormValues>({
    resolver: zodResolver(adjustStockSchema),
    defaultValues: {
      adjustment: 10,
      reason: "RESTOCK",
    },
  });

  const openAdjustModal = (product: Product) => {
    setAdjustingProduct(product);
    reset({
      adjustment: 10,
      reason: "RESTOCK",
    });
    setActionError(null);
  };

  const adjustMutation = useMutation({
    mutationFn: (values: AdjustStockFormValues) =>
      adminService.adjustStock(adjustingProduct!.id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
      setAdjustingProduct(null);
    },
    onError: (err) => setActionError(getErrorMessage(err)),
  });

  const onSubmit = (values: AdjustStockFormValues) => {
    setActionError(null);
    adjustMutation.mutate(values);
  };

  const products = productsResponse?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Inventory Control
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor current warehouse stock levels, inspect low-stock warnings, and record stock adjustments
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Search product inventory..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant={lowStockOnly ? "danger" : "outline"}
            size="sm"
            onClick={() => {
              setLowStockOnly(!lowStockOnly);
              setPage(1);
            }}
            className="gap-1.5"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Low Stock (≤ 5)</span>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="error" title="Failed to load inventory">
          {getErrorMessage(error)}
        </Alert>
      )}

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs text-slate-400 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Product</th>
                <th className="py-3.5 px-4 font-mono">SKU</th>
                <th className="py-3.5 px-4 text-center">Current Stock</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="py-6 px-4 bg-slate-50/50" />
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No products matching current inventory filters.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isOutOfStock = p.stock_quantity <= 0;
                  const isLow = p.stock_quantity > 0 && p.stock_quantity <= 5;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {p.name}
                        {p.category && (
                          <span className="block text-xs font-normal text-slate-400 mt-0.5">
                            {p.category.name}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-xs text-slate-500">{p.sku}</td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`text-base font-bold ${
                            isOutOfStock
                              ? "text-rose-600"
                              : isLow
                              ? "text-amber-600"
                              : "text-slate-800"
                          }`}
                        >
                          {p.stock_quantity}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {isOutOfStock ? (
                          <Badge variant="danger">Out of Stock</Badge>
                        ) : isLow ? (
                          <Badge variant="warning">Low Stock</Badge>
                        ) : (
                          <Badge variant="success">Normal</Badge>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openAdjustModal(p)}
                          className="gap-1 text-xs"
                        >
                          <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Adjust Stock</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {productsResponse?.meta && productsResponse.meta.total_pages > 1 && (
        <div className="flex justify-center pt-2">
          <Pagination
            currentPage={productsResponse.meta.page}
            totalPages={productsResponse.meta.total_pages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={!!adjustingProduct}
        onClose={() => setAdjustingProduct(null)}
        title="Adjust Inventory Stock"
        description={adjustingProduct ? `Product: ${adjustingProduct.name} (Current: ${adjustingProduct.stock_quantity})` : ""}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {actionError && (
            <Alert variant="error" onClose={() => setActionError(null)}>
              {actionError}
            </Alert>
          )}

          <Input
            label="Stock Adjustment (+ to add, - to deduct)"
            type="number"
            step="1"
            required
            placeholder="e.g. 10 or -5"
            helperText="Enter a positive number to restock, or negative to reduce quantity."
            {...register("adjustment")}
            error={errors.adjustment?.message}
          />

          <Select
            label="Adjustment Reason"
            required
            options={[
              { value: "RESTOCK", label: "Restock (Inventory arrived)" },
              { value: "ADJUSTMENT", label: "Audit Adjustment / Damage deduction" },
            ]}
            {...register("reason")}
            error={errors.reason?.message}
          />

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setAdjustingProduct(null)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Apply Adjustment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
