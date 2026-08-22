import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export const PLATFORMS = [
  { value: "AMAZON", label: "Amazon" },
  { value: "FLIPKART", label: "Flipkart" },
  { value: "MEESHO", label: "Meesho" },
  { value: "OTHER", label: "Other" },
] as const;

export const PAYMENT_STATUSES = [
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "PAID", label: "Paid" },
  { value: "FAILED", label: "Failed" },
  { value: "RETURNED_ADJUSTED", label: "Returned/Adjusted" },
] as const;

export const EXPENSE_CATEGORIES = [
  { value: "SHIPPING", label: "Shipping" },
  { value: "PACKAGING", label: "Packaging" },
  { value: "PLATFORM_COMMISSION", label: "Platform Commission" },
  { value: "GST_TAX", label: "GST/Tax" },
  { value: "RETURN_CHARGE", label: "Return Charge" },
  { value: "ADVERTISING", label: "Advertising" },
  { value: "PRODUCT_PURCHASE", label: "Product Purchase" },
  { value: "OTHER", label: "Other" },
] as const;

export const RETURN_REASONS = [
  "Customer Changed Mind",
  "Wrong Size/Color",
  "Defective Product",
  "Damaged in Transit",
  "Not as Described",
  "Late Delivery",
  "Other",
] as const;

export const PRODUCT_CONDITIONS = [
  { value: "GOOD", label: "Good" },
  { value: "DAMAGED", label: "Damaged" },
  { value: "USED", label: "Used" },
  { value: "MISSING", label: "Missing" },
] as const;

export function platformLabel(platform: string): string {
  return PLATFORMS.find((p) => p.value === platform)?.label ?? platform;
}

export function paymentStatusLabel(status: string): string {
  return PAYMENT_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}
