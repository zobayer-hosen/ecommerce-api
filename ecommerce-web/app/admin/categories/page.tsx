"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { categoryService } from "@/services/category.service";
import { adminService } from "@/services/admin.service";
import { Category } from "@/types/category";
import { getErrorMessage } from "@/services/api.client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { Plus, Edit2, Trash2, FolderTree } from "lucide-react";

const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().max(1000).optional().or(z.literal("")),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    data: categories = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => categoryService.getCategories(),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
  });

  const openCreateModal = () => {
    setEditingCategory(null);
    reset({ name: "", description: "" });
    setActionError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    reset({ name: cat.name, description: cat.description || "" });
    setActionError(null);
    setIsModalOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: (values: CategoryFormValues) =>
      adminService.createCategory({
        name: values.name,
        description: values.description || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setIsModalOpen(false);
    },
    onError: (err) => setActionError(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: (values: CategoryFormValues) =>
      adminService.updateCategory(editingCategory!.id, {
        name: values.name,
        description: values.description || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setIsModalOpen(false);
    },
    onError: (err) => setActionError(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (err) => alert(getErrorMessage(err)),
  });

  const onSubmit = (values: CategoryFormValues) => {
    setActionError(null);
    if (editingCategory) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };

  const handleDelete = (cat: Category) => {
    if (cat.product_count > 0) {
      alert(`Cannot delete "${cat.name}" because it still contains ${cat.product_count} product(s). Please reassign or delete the products first.`);
      return;
    }
    if (confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
      deleteMutation.mutate(cat.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Category Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">Organize products into store departments and navigation trees</p>
        </div>

        <Button onClick={openCreateModal} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </Button>
      </div>

      {error && (
        <Alert variant="error" title="Failed to load categories">
          {getErrorMessage(error)}
        </Alert>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs text-slate-400 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Name</th>
                <th className="py-3.5 px-4">Slug</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4 text-center">Products</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="py-6 px-4 bg-slate-50/50" />
                  </tr>
                ))
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No categories found. Click &quot;Add Category&quot; to create one.
                  </td>
                </tr>
              ) : (
                categories.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      <FolderTree className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>{c.name}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500">{c.slug}</td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-sm truncate">
                      {c.description || <span className="italic text-slate-400">None</span>}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-semibold text-slate-800">{c.product_count}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(c)}
                        className="text-slate-500 hover:text-indigo-600 p-1.5"
                        title="Edit Category"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(c)}
                        className="text-slate-500 hover:text-rose-600 p-1.5"
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? "Edit Category" : "Create New Category"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {actionError && (
            <Alert variant="error" onClose={() => setActionError(null)}>
              {actionError}
            </Alert>
          )}

          <Input
            label="Category Name"
            placeholder="e.g. Smart Watches & Wearables"
            required
            {...register("name")}
            error={errors.name?.message}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description (Optional)</label>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Department overview..."
              {...register("description")}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-rose-600">{errors.description.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingCategory ? "Save Changes" : "Create Category"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
