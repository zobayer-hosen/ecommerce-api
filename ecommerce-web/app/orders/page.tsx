"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { orderService } from "@/services/order.service";
import { useAuth } from "@/hooks/useAuth";
import { OrderCard } from "@/components/order/OrderCard";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { getErrorMessage } from "@/services/api.client";
import { Package, ShoppingBag } from "lucide-react";

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PROCESSING", label: "Processing" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");

  React.useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/login?redirect=/orders");
    }
  }, [isAuthLoading, isAuthenticated, router]);

  const {
    data: ordersResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["my-orders", page, status],
    queryFn: () => orderService.getMyOrders({ page, limit: 10, status: status || undefined }),
    enabled: isAuthenticated,
  });

  const orders = ordersResponse?.data || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Order History</h1>
          <p className="text-sm text-slate-500 mt-1">Track and manage your past and active orders</p>
        </div>

        <div className="w-full sm:w-48">
          <Select
            options={STATUS_FILTER_OPTIONS}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {error && (
        <Alert variant="error" title="Failed to load orders" className="mb-6">
          <p>{getErrorMessage(error)}</p>
          <button
            onClick={() => refetch()}
            className="mt-2 text-xs font-semibold text-rose-700 underline hover:no-underline"
          >
            Try Again
          </button>
        </Alert>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 h-40 animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<Package className="w-8 h-8 text-slate-400" />}
          title="No orders found"
          description={
            status
              ? `You do not have any orders with status "${status}".`
              : "You haven't placed any orders yet. Discover our latest items and place your first order today!"
          }
          action={
            <Link href="/products">
              <Button className="gap-2">
                <ShoppingBag className="w-4 h-4" />
                Browse Products
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}

      {ordersResponse?.meta && ordersResponse.meta.total_pages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination
            currentPage={ordersResponse.meta.page}
            totalPages={ordersResponse.meta.total_pages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
