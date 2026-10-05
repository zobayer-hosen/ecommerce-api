"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard.service";
import { formatPrice } from "@/lib/utils";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { getErrorMessage } from "@/services/api.client";
import {
  DollarSign,
  ShoppingCart,
  Calendar,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export default function AdminDashboardPage() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: () => dashboardService.getDashboardStats(),
    refetchInterval: 1000 * 30, // 30 seconds
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <Alert variant="error" title="Failed to load dashboard metrics">
        {getErrorMessage(error)}
      </Alert>
    );
  }

  const statusEntries = Object.entries(stats.orders_by_status || {});

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Admin Overview</h1>
        <p className="text-sm text-slate-500 mt-1">Real-time store metrics, sales performance, and inventory health</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <AdminStatsCard
          title="Total Net Revenue"
          value={formatPrice(stats.total_revenue, "BDT")}
          subtitle="All confirmed & fulfilled orders"
          icon={<DollarSign className="w-5 h-5" />}
          variant="emerald"
        />

        <AdminStatsCard
          title="Orders Today"
          value={stats.orders_today}
          subtitle="Placed in last 24 hours"
          icon={<ShoppingCart className="w-5 h-5" />}
          variant="indigo"
        />

        <AdminStatsCard
          title="Orders Last 30 Days"
          value={stats.orders_last_30_days}
          subtitle="Monthly volume"
          icon={<Calendar className="w-5 h-5" />}
          variant="default"
        />

        <AdminStatsCard
          title="Low Stock Items"
          value={stats.low_stock_count}
          subtitle="Stock quantity ≤ 5"
          icon={<AlertTriangle className="w-5 h-5" />}
          variant={stats.low_stock_count > 0 ? "rose" : "default"}
        />
      </div>

      {/* Two Column Grid: Status Breakdown + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Orders by Status (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <h3 className="text-base font-bold text-slate-900">Orders by Status</h3>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>Manage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {statusEntries.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No order records found.</p>
          ) : (
            <div className="space-y-3">
              {statusEntries.map(([st, count]) => (
                <div key={st} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 text-sm">
                  <div className="flex items-center gap-2">
                    <OrderStatusBadge status={st} />
                  </div>
                  <span className="font-bold text-slate-900">{count} order(s)</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top 5 Products by Units Sold (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">Top 5 Products by Volume</h3>
            </div>
            <Link
              href="/admin/products"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>All Products</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {stats.top_products.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No sales recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-400 uppercase border-b border-slate-100 font-semibold">
                  <tr>
                    <th className="pb-3">Product Name</th>
                    <th className="pb-3 text-center">SKU</th>
                    <th className="pb-3 text-center">Units Sold</th>
                    <th className="pb-3 text-right">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {stats.top_products.map((p) => (
                    <tr key={p.product_id} className="hover:bg-slate-50/50">
                      <td className="py-3 font-medium text-slate-900 truncate max-w-[200px]">{p.name}</td>
                      <td className="py-3 text-center font-mono text-xs text-slate-500">{p.sku}</td>
                      <td className="py-3 text-center font-semibold text-slate-800">{p.units_sold}</td>
                      <td className="py-3 text-right font-bold text-indigo-600">
                        {formatPrice(p.total_sales, "BDT")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
