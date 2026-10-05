"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { productService } from "@/services/product.service";
import { categoryService } from "@/services/category.service";
import { adminService } from "@/services/admin.service";
import { Product, ProductStatus } from "@/types/product";
import { formatPrice } from "@/lib/utils";
import { PRODUCT_STATUS_COLORS } from "@/lib/constants";
import { getErrorMessage } from "@/services/api.client";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { Pagination } from "@/components/ui/Pagination";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
} from "lucide-react";

const productSchema = z.object({
  category_id: z.coerce.number().positive("Please select a valid category"),
  name: z.string().min(2, "Product name must be at least 2 characters").max(200),
  sku: z.string().min(2, "SKU must be at least 2 characters").max(64),
  price: z.coerce.number().positive("Price must be greater than 0"),
  stock_quantity: z.coerce.number().min(0, "Stock quantity cannot be negative"),
  description: z.string().max(5000).optional().or(z.literal("")),
  image_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryService.getCategories(),
  });

  // Fetch products (as admin)
  const {
    data: productsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-products", page, search],
    queryFn: () =>
      productService.getProducts({
        page,
        limit: 10,
        search: search || undefined,
        sort: "newest",
      }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      status: "ACTIVE",
      stock_quantity: 0,
    },
  });

  const openCreateModal = () => {
    setEditingProduct(null);
    reset({
      name: "",
      sku: "",
      category_id: categories[0]?.id || 0,
      price: 0,
      stock_quantity: 0,
      description: "",
      image_url: "",
      status: "ACTIVE",
    });
    setActionError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    reset({
      name: product.name,
      sku: product.sku,
      category_id: product.category_id,
      price: product.price / 100, // Display in standard units (BDT)
      stock_quantity: product.stock_quantity,
      description: product.description || "",
      image_url: product.image_url || "",
      status: product.status,
    });
    setActionError(null);
    setIsModalOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: (values: ProductFormValues) =>
      adminService.createProduct({
        ...values,
        price: Math.round(values.price * 100), // Minor units
        description: values.description || undefined,
        image_url: values.image_url || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setIsModalOpen(false);
    },
    onError: (err) => setActionError(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: (values: ProductFormValues) =>
      adminService.updateProduct(editingProduct!.id, {
        ...values,
        price: Math.round(values.price * 100),
        description: values.description || undefined,
        image_url: values.image_url || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setIsModalOpen(false);
    },
    onError: (err) => setActionError(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (err) => alert(getErrorMessage(err)),
  });

  const onSubmit = (values: ProductFormValues) => {
    setActionError(null);
    if (editingProduct) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };

  const handleDelete = (product: Product) => {
    if (confirm(`Are you sure you want to delete "${product.name}"? It will be soft-deleted.`)) {
      deleteMutation.mutate(product.id);
    }
  };

  const products = productsResponse?.data || [];
  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));
  const statusOptions = [
    { value: "DRAFT", label: "Draft" },
    { value: "ACTIVE", label: "Active" },
    { value: "ARCHIVED", label: "Archived" },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Product Management</h1>
          <p className="text-sm text-slate-500 mt-1">Create, update catalog inventory and adjust product states</p>
        </div>

        <Button onClick={openCreateModal} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </Button>
      </div>

      {/* Search & Actions Filter */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Search by name, SKU..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>
      </div>

      {error && (
        <Alert variant="error" title="Failed to load products">
          {getErrorMessage(error)}
        </Alert>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs text-slate-400 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Product</th>
                <th className="py-3.5 px-4">SKU</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-right">Price</th>
                <th className="py-3.5 px-4 text-center">Stock</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="py-6 px-4 bg-slate-50/50" />
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No products found. Click &quot;Add Product&quot; to create one.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const statusConfig = PRODUCT_STATUS_COLORS[p.status as ProductStatus] || {
                    bg: "bg-slate-100",
                    text: "text-slate-700",
                  };
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                            {p.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 line-clamp-1">{p.name}</p>
                            <p className="text-xs text-slate-400 font-mono">ID: {p.id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-xs text-slate-600">{p.sku}</td>

                      <td className="py-3 px-4 text-slate-600">
                        {p.category ? p.category.name : <span className="text-slate-400 italic">None</span>}
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatPrice(p.price, p.currency)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-semibold ${
                            p.stock_quantity <= 0
                              ? "text-rose-600 font-bold"
                              : p.stock_quantity <= 5
                              ? "text-amber-600 font-bold"
                              : "text-slate-800"
                          }`}
                        >
                          {p.stock_quantity}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}
                        >
                          {p.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(p)}
                          className="text-slate-500 hover:text-indigo-600 p-1.5"
                          title="Edit Product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(p)}
                          className="text-slate-500 hover:text-rose-600 p-1.5"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? "Edit Product" : "Create New Product"}
        description={editingProduct ? `Updating SKU: ${editingProduct.sku}` : "Fill in the product details"}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {actionError && (
            <Alert variant="error" onClose={() => setActionError(null)}>
              {actionError}
            </Alert>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Product Name"
                placeholder="e.g. Wireless Noise-Cancelling Headphones"
                required
                {...register("name")}
                error={errors.name?.message}
              />
            </div>

            <div>
              <Input
                label="SKU (Unique)"
                placeholder="e.g. AUD-WNC-001"
                required
                {...register("sku")}
                error={errors.sku?.message}
              />
            </div>

            <div>
              <Select
                label="Category"
                required
                options={categoryOptions}
                {...register("category_id")}
                error={errors.category_id?.message}
              />
            </div>

            <div>
              <Input
                label="Price (BDT)"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="e.g. 1200.00"
                required
                {...register("price")}
                error={errors.price?.message}
              />
            </div>

            <div>
              <Input
                label="Initial Stock Quantity"
                type="number"
                min="0"
                placeholder="0"
                required
                {...register("stock_quantity")}
                error={errors.stock_quantity?.message}
              />
            </div>

            <div>
              <Select
                label="Status"
                options={statusOptions}
                required
                {...register("status")}
                error={errors.status?.message}
              />
            </div>

            <div>
              <Input
                label="Image URL"
                placeholder="https://images.unsplash.com/..."
                {...register("image_url")}
                error={errors.image_url?.message}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
              <textarea
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Product description and specifications..."
                {...register("description")}
              />
              {errors.description && (
                <p className="mt-1 text-xs text-rose-600">{errors.description.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingProduct ? "Save Changes" : "Create Product"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
