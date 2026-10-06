import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  prefixText?: string;
  rightAction?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, error, helperText, prefixText, rightAction, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, "-") : undefined);

    return (
      <div className="w-full">
        {label && (
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
              {label}
              {props.required && <span className="text-rose-500 ml-1">*</span>}
            </label>
            {rightAction}
          </div>
        )}
        <div className="relative flex items-center">
          {prefixText && (
            <span className="inline-flex items-center px-3 py-2 rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 text-slate-500 text-sm select-none font-medium shrink-0">
              {prefixText}
            </span>
          )}
          <input
            id={inputId}
            type={type}
            ref={ref}
            className={cn(
              "w-full rounded-lg border px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors",
              prefixText && "rounded-l-none",
              error
                ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/20"
                : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 bg-white",
              props.disabled && "bg-slate-50 text-slate-500 cursor-not-allowed",
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
        {!error && helperText && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
