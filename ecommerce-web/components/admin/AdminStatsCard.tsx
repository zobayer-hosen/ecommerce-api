import React from "react";
import { cn } from "@/lib/utils";

export interface AdminStatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: "default" | "indigo" | "emerald" | "amber" | "rose";
}

export function AdminStatsCard({ title, value, subtitle, icon, variant = "default" }: AdminStatsCardProps) {
  const iconVariants = {
    default: "bg-slate-100 text-slate-700",
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
        <h4 className="text-2xl font-bold text-slate-900 mt-1">{value}</h4>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>

      <div className={cn("p-3 rounded-xl shrink-0", iconVariants[variant])}>{icon}</div>
    </div>
  );
}
