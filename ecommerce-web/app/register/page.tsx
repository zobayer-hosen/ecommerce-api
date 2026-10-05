"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/services/api.client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { ShoppingBag, UserPlus } from "lucide-react";

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().email("Please enter a valid email address"),
    phone: z.string().max(20, "Phone number cannot exceed 20 characters").optional().or(z.literal("")),
    password: z.string().min(8, "Password must be at least 8 characters").max(72),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const { register: registerUser, login, isAuthenticated } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  React.useEffect(() => {
    if (isAuthenticated) {
      router.push(redirect);
    }
  }, [isAuthenticated, redirect, router]);

  const onSubmit = async (values: RegisterFormValues) => {
    setErrorMsg(null);
    try {
      // 1. Register user
      await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
        phone: values.phone ? values.phone : undefined,
      });

      // 2. Auto-login on success
      await login({
        email: values.email,
        password: values.password,
      });

      router.push(redirect);
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err));
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl text-indigo-600 mb-2">
          <ShoppingBag className="w-7 h-7" />
          <span>ShopNest</span>
        </Link>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create your account</h2>
        <p className="mt-2 text-sm text-slate-500">
          Already have an account?{" "}
          <Link href={`/login${redirect !== "/" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`} className="font-semibold text-indigo-600 hover:text-indigo-500">
            Sign in instead
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          {errorMsg && (
            <Alert variant="error" className="mb-5" onClose={() => setErrorMsg(null)}>
              {errorMsg}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="e.g. Sarah Jenkins"
              required
              {...register("name")}
              error={errors.name?.message}
            />

            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
              {...register("email")}
              error={errors.email?.message}
            />

            <Input
              label="Phone Number (Optional)"
              type="tel"
              placeholder="+8801700000000"
              {...register("phone")}
              error={errors.phone?.message}
            />

            <Input
              label="Password (min 8 characters)"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="new-password"
              {...register("password")}
              error={errors.password?.message}
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="new-password"
              {...register("confirmPassword")}
              error={errors.confirmPassword?.message}
            />

            <Button type="submit" size="lg" className="w-full gap-2 mt-4" isLoading={isSubmitting}>
              <UserPlus className="w-4 h-4" />
              <span>Create Account</span>
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-400">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
