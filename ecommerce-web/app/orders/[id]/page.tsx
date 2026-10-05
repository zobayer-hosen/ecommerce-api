"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orderService } from "@/services/order.service";
import { useAuth } from "@/hooks/useAuth";
import { formatDate, formatPrice } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { getErrorMessage } from "@/services/api.client";
import {
  ArrowLeft,
  Calendar,
  Truck,
  MapPin,
  Clock,
  FileText,
  Ban,
} from "lucide-react";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = Number(params.id);
  const queryClient = useQueryClient();

  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [cancelError, setCancelError] = useState<string | null>(null);

  React.useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push(`/login?redirect=/orders/${orderId}`);
    }
  }, [isAuthLoading, isAuthenticated, orderId, router]);

  const {
    data: order,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["order-detail", orderId],
    queryFn: () => orderService.getMyOrderDetail(orderId),
    enabled: isAuthenticated && !isNaN(orderId),
  });

  const cancelMutation = useMutation({
    mutationFn: () => orderService.cancelMyOrder(orderId),
    onSuccess: (updated) => {
      queryClient.setQueryData(["order-detail", orderId], updated);
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
    },
    onError: (err: unknown) => {
      setCancelError(getErrorMessage(err));
    },
  });

  const handleCancel = () => {
    if (confirm("Are you sure you want to cancel this order? This will restore the stock immediately.")) {
      setCancelError(null);
      cancelMutation.mutate();
    }
  };

  if (isLoading || isAuthLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-60 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <Alert variant="error" title="Order Not Found">
          {error ? getErrorMessage(error) : "This order could not be found or you do not have permission to view it."}
        </Alert>
        <Link href="/orders" className="inline-block mt-6">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </Button>
        </Link>
      </div>
    );
  }

  const isPending = order.status === "PENDING";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Back Link */}
      <div className="mb-6">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Order History</span>
        </Link>
      </div>

      {cancelError && (
        <Alert variant="error" className="mb-6" onClose={() => setCancelError(null)}>
          {cancelError}
        </Alert>
      )}

      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Order Reference</span>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5">{order.order_number}</h1>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Placed on {formatDate(order.created_at)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <OrderStatusBadge status={order.status} className="text-sm px-3.5 py-1" />

            {isPending && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleCancel}
                isLoading={cancelMutation.isPending}
                className="gap-1.5"
              >
                <Ban className="w-4 h-4" />
                Cancel Order
              </Button>
            )}
          </div>
        </div>

        {/* Note if any */}
        {order.note && (
          <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-600 flex items-start gap-2">
            <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-700">Order Note:</span> {order.note}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Side: Items & Pricing Summary (2 cols) */}
        <div className="md:col-span-2 space-y-8">
          {/* Order Items */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 mb-4">
              Order Items ({order.items?.length || 0})
            </h3>

            <div className="divide-y divide-slate-100">
              {order.items?.map((item) => (
                <div key={item.id} className="py-3.5 flex items-center justify-between text-sm">
                  <div>
                    <h4 className="font-semibold text-slate-900">{item.product_name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">SKU: {item.sku}</p>
                    <p className="text-xs text-slate-600 mt-1">
                      {item.quantity} × {formatPrice(item.unit_price, order.currency)}
                    </p>
                  </div>

                  <span className="font-bold text-slate-900">
                    {formatPrice(item.line_total, order.currency)}
                  </span>
                </div>
              ))}
            </div>

            {/* Subtotal, Shipping, Total */}
            <div className="pt-4 mt-2 border-t border-slate-100 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-medium text-slate-900">{formatPrice(order.subtotal, order.currency)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping Fee:</span>
                <span className="font-medium text-slate-900">
                  {order.shipping_fee === 0 ? "Free" : formatPrice(order.shipping_fee, order.currency)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline">
                <span className="text-base font-bold text-slate-900">Total Paid / Due:</span>
                <span className="text-xl font-bold text-indigo-600">
                  {formatPrice(order.total_amount, order.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Status Timeline History */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
              <Clock className="w-4 h-4 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">Status History Timeline</h3>
            </div>

            {order.status_history && order.status_history.length > 0 ? (
              <div className="relative pl-6 space-y-4 border-l-2 border-indigo-100 ml-2">
                {order.status_history.map((hist) => (
                  <div key={hist.id} className="relative">
                    <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-indigo-600 border-2 border-white ring-2 ring-indigo-200" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                        {hist.to_status}
                      </span>
                      <span className="text-xs text-slate-400 ml-2">{formatDate(hist.created_at)}</span>
                      {hist.note && <p className="text-xs text-slate-500 mt-1 italic">&ldquo;{hist.note}&rdquo;</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No status transitions recorded yet.</p>
            )}
          </div>
        </div>

        {/* Right Side: Shipping Address & Details (1 col) */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
              <MapPin className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Shipping Address</h3>
            </div>

            <div className="text-sm text-slate-600 space-y-1.5">
              <p className="font-semibold text-slate-900">{order.shipping_address.full_name}</p>
              <p>{order.shipping_address.line1}</p>
              <p>
                {order.shipping_address.city}, {order.shipping_address.postal_code}
              </p>
              <p>{order.shipping_address.country}</p>
              <div className="pt-2 text-xs font-mono text-slate-500">
                Phone: {order.shipping_address.phone}
              </div>
            </div>
          </div>

          {/* Delivery Policy Note */}
          <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs text-indigo-900 space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-indigo-700">
              <Truck className="w-4 h-4" />
              <span>Delivery Status</span>
            </div>
            <p>
              Orders are dispatched once confirmed. You will receive updates as the status changes from processing to shipped.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
