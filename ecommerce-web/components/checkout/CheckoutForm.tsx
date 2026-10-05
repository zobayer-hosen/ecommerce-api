"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { orderService } from "@/services/order.service";
import { useCart } from "@/hooks/useCart";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { getErrorMessage } from "@/services/api.client";
import { ShieldCheck, Truck } from "lucide-react";

const checkoutSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters").max(100),
  phone: z.string().min(5, "Phone number must be at least 5 digits").max(20),
  line1: z.string().min(3, "Address must be at least 3 characters").max(200),
  city: z.string().min(2, "City must be at least 2 characters").max(100),
  postal_code: z.string().min(2, "Postal code must be at least 2 characters").max(20),
  country: z.string().min(2, "Country must be at least 2 characters").max(10),
  note: z.string().max(500, "Note cannot exceed 500 characters").optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export function CheckoutForm() {
  const router = useRouter();
  const { refreshCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      country: "BD",
    },
  });

  const onSubmit = async (values: CheckoutFormValues) => {
    setIsSubmitting(true);
    setErrorMsg(null);

    // Generate unique idempotency key for this checkout attempt
    const idempotencyKey = `chk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    try {
      const order = await orderService.checkout(
        {
          shipping_address: {
            full_name: values.full_name,
            phone: values.phone,
            line1: values.line1,
            city: values.city,
            postal_code: values.postal_code,
            country: values.country,
          },
          note: values.note ? values.note : undefined,
        },
        idempotencyKey
      );

      // Refresh cart state since items are cleared on checkout
      refreshCart();
      router.push(`/orders/${order.id}`);
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {errorMsg && (
        <Alert variant="error" title="Checkout Failed" onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      )}

      {/* Address Form Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-100">
          <Truck className="w-5 h-5 text-indigo-600" />
          <h3 className="text-base font-semibold text-slate-900">Shipping Address</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input
              label="Full Name"
              placeholder="e.g. Rahim Uddin"
              required
              {...register("full_name")}
              error={errors.full_name?.message}
            />
          </div>

          <div>
            <Input
              label="Contact Phone"
              placeholder="+8801700000000"
              required
              {...register("phone")}
              error={errors.phone?.message}
            />
          </div>

          <div>
            <Input
              label="Country"
              placeholder="BD"
              required
              {...register("country")}
              error={errors.country?.message}
            />
          </div>

          <div className="sm:col-span-2">
            <Input
              label="Street Address / House & Road"
              placeholder="House 12, Road 5, Block B"
              required
              {...register("line1")}
              error={errors.line1?.message}
            />
          </div>

          <div>
            <Input
              label="City"
              placeholder="Dhaka"
              required
              {...register("city")}
              error={errors.city?.message}
            />
          </div>

          <div>
            <Input
              label="Postal Code"
              placeholder="1205"
              required
              {...register("postal_code")}
              error={errors.postal_code?.message}
            />
          </div>

          <div className="sm:col-span-2">
            <Input
              label="Delivery Instructions / Note (Optional)"
              placeholder="e.g. Call before delivery, ring doorbell"
              {...register("note")}
              error={errors.note?.message}
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <Button type="submit" size="lg" isLoading={isSubmitting} className="w-full">
        Confirm and Place Order
      </Button>

      <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>Secure checkout with real-time stock verification</span>
      </div>
    </form>
  );
}
