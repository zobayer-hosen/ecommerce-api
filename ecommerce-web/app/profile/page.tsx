"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/useAuth";
import { userService } from "@/services/user.service";
import { formatDate } from "@/lib/utils";
import { getErrorMessage } from "@/services/api.client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { User, Lock, KeyRound } from "lucide-react";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().max(20, "Phone number cannot exceed 20 characters").optional().or(z.literal("")),
});

const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z.string().min(8, "New password must be at least 8 characters").max(72),
    confirm_new_password: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.new_password === data.confirm_new_password, {
    message: "New passwords do not match",
    path: ["confirm_new_password"],
  });

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth();

  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: isProfileSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: {
      name: user?.name || "",
      phone: user?.phone || "",
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
    reset: resetPassword,
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?redirect=/profile");
    }
  }, [isLoading, isAuthenticated, router]);

  const onUpdateProfile = async (values: ProfileFormValues) => {
    setProfileSuccess(null);
    setProfileError(null);
    try {
      await userService.updateProfile({
        name: values.name,
        phone: values.phone ? values.phone : undefined,
      });
      await refreshUser();
      setProfileSuccess("Your profile details have been successfully updated.");
    } catch (err: unknown) {
      setProfileError(getErrorMessage(err));
    }
  };

  const onChangePassword = async (values: PasswordFormValues) => {
    setPasswordSuccess(null);
    setPasswordError(null);
    try {
      await userService.changePassword({
        current_password: values.current_password,
        new_password: values.new_password,
      });
      resetPassword();
      setPasswordSuccess("Your password was changed successfully. Active sessions have been refreshed.");
    } catch (err: unknown) {
      setPasswordError(getErrorMessage(err));
    }
  };

  if (isLoading || !user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-500">
        Loading user profile...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Account Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your personal profile and account credentials</p>
      </div>

      <div className="space-y-8">
        {/* User Summary Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xl">
              {user.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">{user.name}</h3>
                <Badge variant={user.role === "ADMIN" ? "info" : "default"}>{user.role}</Badge>
              </div>
              <p className="text-sm text-slate-500">{user.email}</p>
              <p className="text-xs text-slate-400 mt-0.5">Member since {formatDate(user.created_at)}</p>
            </div>
          </div>
        </div>

        {/* Profile Edit Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-slate-100">
            <User className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Personal Information</h3>
          </div>

          {profileSuccess && (
            <Alert variant="success" className="mb-5" onClose={() => setProfileSuccess(null)}>
              {profileSuccess}
            </Alert>
          )}

          {profileError && (
            <Alert variant="error" className="mb-5" onClose={() => setProfileError(null)}>
              {profileError}
            </Alert>
          )}

          <form onSubmit={handleProfileSubmit(onUpdateProfile)} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <Input
                  label="Full Name"
                  required
                  {...registerProfile("name")}
                  error={profileErrors.name?.message}
                />
              </div>

              <div>
                <Input
                  label="Email Address (Read-only)"
                  value={user.email}
                  disabled
                  helperText="Email cannot be changed directly"
                />
              </div>

              <div className="sm:col-span-2">
                <Input
                  label="Phone Number"
                  placeholder="+8801700000000"
                  {...registerProfile("phone")}
                  error={profileErrors.phone?.message}
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <Button type="submit" isLoading={isProfileSubmitting}>
                Save Profile Changes
              </Button>
            </div>
          </form>
        </div>

        {/* Change Password Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-slate-100">
            <KeyRound className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Change Password</h3>
          </div>

          {passwordSuccess && (
            <Alert variant="success" className="mb-5" onClose={() => setPasswordSuccess(null)}>
              {passwordSuccess}
            </Alert>
          )}

          {passwordError && (
            <Alert variant="error" className="mb-5" onClose={() => setPasswordError(null)}>
              {passwordError}
            </Alert>
          )}

          <form onSubmit={handlePasswordSubmit(onChangePassword)} className="space-y-5 max-w-lg">
            <Input
              label="Current Password"
              type="password"
              required
              {...registerPassword("current_password")}
              error={passwordErrors.current_password?.message}
            />

            <Input
              label="New Password"
              type="password"
              required
              placeholder="At least 8 characters"
              {...registerPassword("new_password")}
              error={passwordErrors.new_password?.message}
            />

            <Input
              label="Confirm New Password"
              type="password"
              required
              {...registerPassword("confirm_new_password")}
              error={passwordErrors.confirm_new_password?.message}
            />

            <div className="pt-2">
              <Button type="submit" variant="secondary" isLoading={isPasswordSubmitting} className="gap-2">
                <Lock className="w-4 h-4" />
                Update Password
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
