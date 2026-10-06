import React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  charCount?: number;
  maxCharCount?: number;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      charCount,
      maxCharCount,
      id,
      ...props
    },
    ref
  ) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, "-") : undefined);

    return (
      <div className="w-full">
        {label && (
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor={textareaId} className="block text-sm font-medium text-slate-700">
              {label}
              {props.required && <span className="text-rose-500 ml-1">*</span>}
            </label>
            {maxCharCount !== undefined && charCount !== undefined && (
              <span className="text-xs text-slate-400">
                {charCount}/{maxCharCount}
              </span>
            )}
          </div>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          className={cn(
            "w-full rounded-lg border px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors resize-y",
            error
              ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/20"
              : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 bg-white",
            props.disabled && "bg-slate-50 text-slate-500 cursor-not-allowed",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
        {!error && helperText && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
