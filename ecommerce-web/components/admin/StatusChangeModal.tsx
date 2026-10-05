"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Order } from "@/types/order";
import { ALLOWED_STATUS_TRANSITIONS, OrderStatus } from "@/lib/constants";
import { adminService } from "@/services/admin.service";
import { getErrorMessage } from "@/services/api.client";
import { Alert } from "@/components/ui/Alert";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";

export interface StatusChangeModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedOrder: Order) => void;
}

export function StatusChangeModal({ order, isOpen, onClose, onSuccess }: StatusChangeModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!order) return null;

  const allowedNext = ALLOWED_STATUS_TRANSITIONS[order.status] || [];
  const statusOptions = allowedNext.map((st) => ({
    value: st,
    label: st,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStatus) {
      setErrorMsg("Please select a target status.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const updated = await adminService.updateOrderStatus(order.id, {
        status: selectedStatus as OrderStatus,
        note: note.trim() ? note.trim() : undefined,
      });

      onSuccess(updated);
      onClose();
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Order Status"
      description={`Change status for order #${order.order_number}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <Alert variant="error" onClose={() => setErrorMsg(null)}>
            {errorMsg}
          </Alert>
        )}

        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-sm">
          <span className="text-slate-600">Current Status:</span>
          <OrderStatusBadge status={order.status} />
        </div>

        {allowedNext.length === 0 ? (
          <Alert variant="info">
            This order is in a terminal status ({order.status}) and cannot be transitioned further.
          </Alert>
        ) : (
          <>
            <Select
              label="Next Status"
              placeholder="Select allowed next status..."
              required
              options={statusOptions}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            />

            <Input
              label="Status Change Note (Optional)"
              placeholder="e.g. Courier tracking #TRK12345 or reason for cancellation"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              Note: Transitioning to <strong>CANCELLED</strong> will automatically restore stock for all items
              in the order.
            </div>
          </>
        )}

        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          {allowedNext.length > 0 && (
            <Button type="submit" isLoading={isLoading} disabled={!selectedStatus}>
              Save Status
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
