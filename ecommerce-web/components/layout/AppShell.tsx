"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
