"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { Order } from "@/types/order";
import { formatDate, formatPrice } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { StatusChangeModal } from "@/components/admin/StatusChangeModal";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { Alert } from "@/components/ui/Alert";
import { Modal } from "@/components/ui/Modal";
import { getErrorMessage } from "@/services/api.client";
import {
  RotateCcw,
  Eye,
  Sliders,
  MapPin,
  Package,
} from "lucide-react";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PROCESSING", label: "Processing" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [userIdFilter, setUserIdFilter] = useState("");
  const [inspectingOrder, setInspectingOrder] = useState<Order | null>(null);
  const [statusModalOrder, setStatusModalOrder] = useState<Order | null>(null);

  const {
    data: ordersResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-orders", page, status, userIdFilter],
    queryFn: () =>
      adminService.getOrders({
        page,
        limit: 10,
        status: status || undefined,
        user_id: userIdFilter ? Number(userIdFilter) : undefined,
      }),
  });

  const handleStatusUpdateSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
  };

  const handleResetFilters = () => {
    setStatus("");
    setUserIdFilter("");
    setPage(1);
  };

  const orders = ordersResponse?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Order Management</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review customer checkouts, verify addresses, and process order fulfillment state transitions
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center gap-4">
        <div className="w-full sm:w-48">
          <Select
            label="Filter Status"
            options={STATUS_OPTIONS}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="w-full sm:w-48">
          <Input
            label="User ID"
            placeholder="e.g. 1"
            type="number"
            value={userIdFilter}
            onChange={(e) => {
              setUserIdFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="sm:self-end pt-2 sm:pt-0">
          <Button variant="ghost" size="sm" onClick={handleResetFilters} className="text-xs text-slate-500">
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Reset Filters
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="error" title="Failed to load orders">
          {getErrorMessage(error)}
        </Alert>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs text-slate-400 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Order Number</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Total Amount</th>
                <th className="py-3.5 px-4 text-center">Date Placed</th>
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
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No orders found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 font-mono text-xs">
                      {o.order_number}
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900">{o.shipping_address?.full_name}</p>
                      <p className="text-xs text-slate-400">User ID: {o.user_id}</p>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <OrderStatusBadge status={o.status} />
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {formatPrice(o.total_amount, o.currency)}
                    </td>

                    <td className="py-3.5 px-4 text-center text-xs text-slate-500">
                      {formatDate(o.created_at)}
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setInspectingOrder(o)}
                        className="text-slate-600 hover:text-indigo-600 p-1.5"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setStatusModalOrder(o)}
                        className="text-xs gap-1"
                      >
                        <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Status</span>
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
      {ordersResponse?.meta && ordersResponse.meta.total_pages > 1 && (
        <div className="flex justify-center pt-2">
          <Pagination
            currentPage={ordersResponse.meta.page}
            totalPages={ordersResponse.meta.total_pages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Order Status Change Modal */}
      <StatusChangeModal
        order={statusModalOrder}
        isOpen={!!statusModalOrder}
        onClose={() => setStatusModalOrder(null)}
        onSuccess={handleStatusUpdateSuccess}
      />

      {/* Inspect Order Detail Modal */}
      {inspectingOrder && (
        <Modal
          isOpen={!!inspectingOrder}
          onClose={() => setInspectingOrder(null)}
          title={`Order #${inspectingOrder.order_number}`}
          description={`Placed by user #${inspectingOrder.user_id} on ${formatDate(inspectingOrder.created_at)}`}
          maxWidth="lg"
        >
          <div className="space-y-5 text-sm">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="font-semibold text-slate-700">Current Status:</span>
              <OrderStatusBadge status={inspectingOrder.status} />
            </div>

            {/* Shipping Address */}
            <div className="border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-2 font-semibold text-slate-800 mb-2">
                <MapPin className="w-4 h-4 text-indigo-600" />
                <span>Shipping Address</span>
              </div>
              <div className="text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800">{inspectingOrder.shipping_address.full_name}</p>
                <p>{inspectingOrder.shipping_address.line1}</p>
                <p>
                  {inspectingOrder.shipping_address.city}, {inspectingOrder.shipping_address.postal_code},{" "}
                  {inspectingOrder.shipping_address.country}
                </p>
                <p className="pt-1 font-mono">Phone: {inspectingOrder.shipping_address.phone}</p>
              </div>
            </div>

            {/* Items */}
            {inspectingOrder.items && inspectingOrder.items.length > 0 && (
              <div className="border border-slate-200 rounded-xl p-4">
                <div className="flex items-center gap-2 font-semibold text-slate-800 mb-3">
                  <Package className="w-4 h-4 text-indigo-600" />
                  <span>Items</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {inspectingOrder.items.map((item) => (
                    <div key={item.id} className="py-2 flex justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">{item.product_name}</p>
                        <p className="text-slate-400">
                          SKU: {item.sku} | Qty: {item.quantity} × {formatPrice(item.unit_price, inspectingOrder.currency)}
                        </p>
                      </div>
                      <span className="font-bold text-slate-900">
                        {formatPrice(item.line_total, inspectingOrder.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Financials */}
            <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1.5">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold">{formatPrice(inspectingOrder.subtotal, inspectingOrder.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Fee:</span>
                <span className="font-semibold">
                  {inspectingOrder.shipping_fee === 0 ? "Free" : formatPrice(inspectingOrder.shipping_fee, inspectingOrder.currency)}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-sm text-indigo-600">
                <span>Total Amount:</span>
                <span>{formatPrice(inspectingOrder.total_amount, inspectingOrder.currency)}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
