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
import { Textarea } from "@/components/ui/Textarea";
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
  PackagePlus,
  Sparkles,
  DollarSign,
  Image as ImageIcon,
  AlertCircle,
  FolderPlus,
} from "lucide-react";

const productSchema = z.object({
  category_id: z.coerce
    .number({ invalid_type_error: "Please select a category" })
    .positive("Please select a valid category"),
  name: z
    .string()
    .trim()
    .min(2, "Product name must be at least 2 characters")
    .max(200, "Product name cannot exceed 200 characters"),
  sku: z
    .string()
    .trim()
    .min(2, "SKU must be at least 2 characters")
    .max(64, "SKU cannot exceed 64 characters"),
  price: z.coerce
    .number({ invalid_type_error: "Please enter a valid price" })
    .positive("Price must be greater than 0"),
  stock_quantity: z.coerce
    .number({ invalid_type_error: "Please enter stock quantity" })
    .min(0, "Stock quantity cannot be negative"),
  description: z.string().max(5000, "Description cannot exceed 5000 characters").optional().or(z.literal("")),
  image_url: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || /^https?:\/\/.+/.test(val),
      "Must be a valid URL starting with http:// or https://"
    )
    .or(z.literal("")),
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

  // Quick Category Modal State
  const [isQuickCategoryOpen, setIsQuickCategoryOpen] = useState(false);
  const [quickCategoryName, setQuickCategoryName] = useState("");
  const [quickCategoryDesc, setQuickCategoryDesc] = useState("");
  const [quickCategoryLoading, setQuickCategoryLoading] = useState(false);
  const [quickCategoryError, setQuickCategoryError] = useState<string | null>(null);

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
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      status: "ACTIVE",
      stock_quantity: 0,
    },
  });

  const watchedImageUrl = watch("image_url");
  const watchedDescription = watch("description") || "";
  const watchedName = watch("name");

  const openCreateModal = () => {
    setEditingProduct(null);
    reset({
      name: "",
      sku: "",
      category_id: categories.length > 0 ? categories[0].id : ("" as unknown as number),
      price: "" as unknown as number,
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

  // Auto-generate SKU helper
  const generateSku = () => {
    const basePrefix = watchedName
      ? watchedName
          .trim()
          .toUpperCase()
          .replace(/[^A-Z0-9]+/g, "-")
          .slice(0, 6)
          .replace(/-+$/, "")
      : "PRD";
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    setValue("sku", `${basePrefix || "PRD"}-${randomSuffix}`, { shouldValidate: true });
  };

  const createMutation = useMutation({
    mutationFn: (values: ProductFormValues) =>
      adminService.createProduct({
        ...values,
        price: Math.round(values.price * 100), // Minor units
        description: values.description?.trim() ? values.description.trim() : undefined,
        image_url: values.image_url?.trim() ? values.image_url.trim() : undefined,
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
        description: values.description?.trim() ? values.description.trim() : undefined,
        image_url: values.image_url?.trim() ? values.image_url.trim() : undefined,
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

  // Handle Quick Category Create
  const handleQuickCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCategoryName.trim()) return;
    setQuickCategoryLoading(true);
    setQuickCategoryError(null);
    try {
      const created = await adminService.createCategory({
        name: quickCategoryName.trim(),
        description: quickCategoryDesc.trim() || undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
      setValue("category_id", created.id, { shouldValidate: true });
      setQuickCategoryName("");
      setQuickCategoryDesc("");
      setIsQuickCategoryOpen(false);
    } catch (err) {
      setQuickCategoryError(getErrorMessage(err));
    } finally {
      setQuickCategoryLoading(false);
    }
  };

  const products = productsResponse?.data || [];
  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));
  const statusOptions = [
    { value: "ACTIVE", label: "Active (Visible in Store)" },
    { value: "DRAFT", label: "Draft (Hidden from Catalog)" },
    { value: "ARCHIVED", label: "Archived (Discontinued)" },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Product Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Create, update catalog inventory and adjust product states
          </p>
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
        description={
          editingProduct
            ? `Updating SKU: ${editingProduct.sku}`
            : "Fill in the product details below to add it to your store catalog"
        }
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {actionError && (
            <Alert variant="error" onClose={() => setActionError(null)}>
              {actionError}
            </Alert>
          )}

          {/* Alert if no categories exist */}
          {categories.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-sm text-amber-900 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-amber-800">No categories found in store</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Every product must belong to a category. Create a category right now before proceeding.
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-2 text-xs bg-white border-amber-300 text-amber-900 hover:bg-amber-100"
                  onClick={() => setIsQuickCategoryOpen(true)}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>Create Quick Category</span>
                </Button>
              </div>
            </div>
          )}

          {/* Section 1: General Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <PackagePlus className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                General Information
              </h4>
            </div>

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
                <Select
                  label="Category"
                  required
                  placeholder="Select a category..."
                  options={categoryOptions}
                  rightAction={
                    <button
                      type="button"
                      onClick={() => setIsQuickCategoryOpen(true)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>New Category</span>
                    </button>
                  }
                  {...register("category_id")}
                  error={errors.category_id?.message}
                  helperText={
                    categoryOptions.length === 0
                      ? "Create a category first to select"
                      : undefined
                  }
                />
              </div>

              <div>
                <Input
                  label="SKU (Unique Code)"
                  placeholder="e.g. AUD-WNC-001"
                  required
                  rightAction={
                    <button
                      type="button"
                      onClick={generateSku}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 transition-colors"
                      title="Auto-generate SKU"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-500" />
                      <span>Auto Generate</span>
                    </button>
                  }
                  {...register("sku")}
                  error={errors.sku?.message}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Pricing & Inventory */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Pricing & Inventory
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Input
                  label="Price"
                  prefixText="BDT"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="1200.00"
                  required
                  {...register("price")}
                  error={errors.price?.message}
                />
              </div>

              <div>
                <Input
                  label="Initial Stock"
                  type="number"
                  min="0"
                  placeholder="0"
                  required
                  {...register("stock_quantity")}
                  error={errors.stock_quantity?.message}
                  helperText="Units available for sale"
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
            </div>
          </div>

          {/* Section 3: Media & Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <ImageIcon className="w-4 h-4 text-violet-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Media & Details
              </h4>
            </div>

            <div className="space-y-4">
              <div>
                <Input
                  label="Image URL (Optional)"
                  placeholder="https://images.unsplash.com/..."
                  helperText="Direct URL to product image (JPG, PNG, WebP)"
                  {...register("image_url")}
                  error={errors.image_url?.message}
                />

                {/* Live Image Preview */}
                {watchedImageUrl && watchedImageUrl.trim() !== "" && (
                  <div className="mt-2.5 flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="w-14 h-14 rounded-md bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={watchedImageUrl.trim()}
                        alt="Product preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                          const fallback = (e.target as HTMLElement).nextElementSibling;
                          if (fallback) fallback.classList.remove("hidden");
                        }}
                      />
                      <div className="hidden flex-col items-center justify-center text-rose-500 p-1 text-center">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-[9px] mt-0.5 leading-none">Load error</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800">Image Preview</p>
                      <p className="text-xs text-slate-400 truncate mt-0.5 font-mono">
                        {watchedImageUrl}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setValue("image_url", "")}
                      className="text-xs text-slate-400 hover:text-rose-600 font-medium px-2 py-1 rounded transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div>
                <Textarea
                  label="Description (Optional)"
                  rows={3}
                  placeholder="Enter detailed product description, specifications, and warranty details..."
                  charCount={watchedDescription.length}
                  maxCharCount={5000}
                  {...register("description")}
                  error={errors.description?.message}
                />
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingProduct ? "Save Changes" : "Create Product"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Quick Category Modal */}
      <Modal
        isOpen={isQuickCategoryOpen}
        onClose={() => setIsQuickCategoryOpen(false)}
        title="Add New Category"
        description="Quickly create a category to assign your product to"
        maxWidth="md"
      >
        <form onSubmit={handleQuickCategorySubmit} className="space-y-4">
          {quickCategoryError && (
            <Alert variant="error" onClose={() => setQuickCategoryError(null)}>
              {quickCategoryError}
            </Alert>
          )}

          <Input
            label="Category Name"
            placeholder="e.g. Wireless Audio"
            required
            value={quickCategoryName}
            onChange={(e) => setQuickCategoryName(e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              placeholder="Short category summary..."
              value={quickCategoryDesc}
              onChange={(e) => setQuickCategoryDesc(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsQuickCategoryOpen(false)}
              disabled={quickCategoryLoading}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={quickCategoryLoading}>
              <FolderPlus className="w-4 h-4 mr-1.5" />
              <span>Create & Assign</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
