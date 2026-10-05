import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format price in minor units (paisa/cents) to formatted currency string
 * e.g., 1200000 -> "৳ 12,000.00"
 */
export function formatPrice(amountMinor: number, currency: string = "BDT"): string {
  const symbol = currency === "BDT" ? "৳" : "$";
  const mainUnit = amountMinor / 100;
  return `${symbol} ${mainUnit.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format an ISO date string to a localized readable format
 */
export function formatDate(dateString: string): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
