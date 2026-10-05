"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { User } from "@/types/user";
import { formatDate } from "@/lib/utils";
import { getErrorMessage } from "@/services/api.client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Pagination } from "@/components/ui/Pagination";
import { Search, UserCheck, UserX, Shield } from "lucide-react";

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    data: usersResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-users", page, search],
    queryFn: () => adminService.getUsers(page, 10, search || undefined),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { role?: "CUSTOMER" | "ADMIN"; is_active?: boolean } }) =>
      adminService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err) => setActionError(getErrorMessage(err)),
  });

  const handleToggleActive = (user: User) => {
    const action = user.is_active ? "deactivate" : "activate";
    if (confirm(`Are you sure you want to ${action} user "${user.name}" (${user.email})?`)) {
      setActionError(null);
      updateUserMutation.mutate({
        id: user.id,
        data: { is_active: !user.is_active },
      });
    }
  };

  const handleChangeRole = (user: User) => {
    const targetRole = user.role === "ADMIN" ? "CUSTOMER" : "ADMIN";
    if (confirm(`Change role of user "${user.name}" to ${targetRole}?`)) {
      setActionError(null);
      updateUserMutation.mutate({
        id: user.id,
        data: { role: targetRole },
      });
    }
  };

  const users = usersResponse?.data || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">User Management</h1>
        <p className="text-sm text-slate-500 mt-1">
          Inspect registered customer and administrator accounts, adjust permissions and activation flags
        </p>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Search by name or email..."
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

      {actionError && (
        <Alert variant="error" onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}

      {error && (
        <Alert variant="error" title="Failed to load users">
          {getErrorMessage(error)}
        </Alert>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs text-slate-400 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4 text-center">Role</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Registered</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="py-6 px-4 bg-slate-50/50" />
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No users found matching current query.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                          {u.name?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{u.name}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs font-mono text-slate-600">
                      {u.phone || <span className="text-slate-400 italic">None</span>}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <Badge variant={u.role === "ADMIN" ? "info" : "default"}>{u.role}</Badge>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {u.is_active ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="danger">Deactivated</Badge>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center text-xs text-slate-500">
                      {formatDate(u.created_at)}
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      {/* Toggle Role */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleChangeRole(u)}
                        className="text-xs"
                        title={`Make ${u.role === "ADMIN" ? "Customer" : "Admin"}`}
                      >
                        <Shield className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                        <span>{u.role === "ADMIN" ? "Demote" : "Make Admin"}</span>
                      </Button>

                      {/* Toggle Active */}
                      <Button
                        variant={u.is_active ? "ghost" : "primary"}
                        size="sm"
                        onClick={() => handleToggleActive(u)}
                        className={u.is_active ? "text-rose-600 hover:bg-rose-50" : "bg-emerald-600 hover:bg-emerald-700"}
                        title={u.is_active ? "Deactivate user" : "Activate user"}
                      >
                        {u.is_active ? (
                          <>
                            <UserX className="w-3.5 h-3.5 mr-1" />
                            <span>Deactivate</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5 mr-1" />
                            <span>Activate</span>
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {usersResponse?.meta && usersResponse.meta.total_pages > 1 && (
        <div className="flex justify-center pt-2">
          <Pagination
            currentPage={usersResponse.meta.page}
            totalPages={usersResponse.meta.total_pages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
