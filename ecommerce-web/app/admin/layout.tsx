"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Button } from "@/components/ui/Button";
import { ShieldAlert } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-400 text-sm">
        Verifying administrative authorization...
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-white">
          <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold">Access Restricted</h2>
          <p className="text-sm text-slate-400 mt-2 mb-6">
            You must be logged in with an <strong>ADMIN</strong> role to access the administrative control panel.
          </p>
          <div className="flex gap-3">
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800">
                Back to Store
              </Button>
            </Link>
            <Link href="/login?redirect=/admin" className="flex-1">
              <Button className="w-full">Sign In</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100/70 text-slate-900">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto max-h-screen">
        <div className="p-6 sm:p-8 lg:p-10 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
