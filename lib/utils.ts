/**
 * @file lib/utils.ts
 * Core utility functions used across the application.
 *
 * WHY: shadcn/ui requires `cn()` here. We co-locate all general-purpose
 * utilities in this file to keep the import path consistent: "@/lib/utils".
 *
 * Rules:
 * - Pure functions only — no side effects.
 * - No external state dependencies.
 * - Every function must be exported and documented.
 */

import { clsx, type ClassValue } from "clsx";
import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";
import { twMerge } from "tailwind-merge";

import { DATE_FORMAT, DATETIME_FORMAT } from "@/lib/constants";

// ─── Styling ──────────────────────────────────────────────────────────────────

/**
 * Merges Tailwind CSS class names with conflict resolution.
 * Required by shadcn/ui — do not remove or rename.
 *
 * @example cn("px-4 py-2", isActive && "bg-primary", className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Currency ─────────────────────────────────────────────────────────────────

/**
 * Formats a number as a currency string using the Intl API.
 *
 * @param amount - The numeric amount to format.
 * @param currency - ISO 4217 currency code (default: "INR").
 * @param locale - BCP 47 locale tag (default: "en-IN").
 *
 * @example formatCurrency(12500)        // "₹12,500.00"
 * @example formatCurrency(99.5, "USD")  // "$99.50"
 */
export function formatCurrency(
  amount: number,
  currency: string = "INR",
  locale: string = "en-IN",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats a compact currency representation for dashboard cards.
 *
 * @example formatCurrencyCompact(1_250_000) // "₹12.5L"
 * @example formatCurrencyCompact(75_000)    // "₹75K"
 */
export function formatCurrencyCompact(amount: number, currency: string = "INR"): string {
  const locale = currency === "INR" ? "en-IN" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

// ─── Dates ────────────────────────────────────────────────────────────────────

/**
 * Formats an ISO date string or Date object to the app's standard date format.
 *
 * @example formatDate("2024-03-15T10:00:00Z") // "15 Mar 2024"
 */
export function formatDate(
  date: string | Date | null | undefined,
  formatStr: string = DATE_FORMAT,
): string {
  if (!date) return "—";

  const parsed = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(parsed)) return "Invalid date";

  return format(parsed, formatStr);
}

/**
 * Formats a date as a relative time string.
 *
 * @example formatRelativeTime("2024-03-10T10:00:00Z") // "5 days ago"
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return "—";

  const parsed = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(parsed)) return "Invalid date";

  return formatDistanceToNow(parsed, { addSuffix: true });
}

/**
 * Formats an ISO date string to the app's standard datetime format.
 *
 * @example formatDateTime("2024-03-15T14:30:00Z") // "15 Mar 2024, 14:30"
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  return formatDate(date, DATETIME_FORMAT);
}

// ─── Strings ──────────────────────────────────────────────────────────────────

/**
 * Truncates a string to the given length with an ellipsis.
 *
 * @example truncate("Hello, World!", 8) // "Hello, W..."
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}...`;
}

/**
 * Converts a string to title case.
 *
 * @example toTitleCase("hello world") // "Hello World"
 */
export function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

/**
 * Generates initials from a full name for avatar placeholders.
 *
 * @example getInitials("John Doe")     // "JD"
 * @example getInitials("Alice")        // "A"
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

// ─── Numbers ──────────────────────────────────────────────────────────────────

/**
 * Formats a large number with locale-appropriate separators.
 *
 * @example formatNumber(1234567) // "12,34,567" (en-IN)
 */
export function formatNumber(num: number, locale: string = "en-IN"): string {
  return new Intl.NumberFormat(locale).format(num);
}

/**
 * Clamps a number between a minimum and maximum value.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ─── Objects ──────────────────────────────────────────────────────────────────

/**
 * Removes undefined and null values from an object.
 * Useful for building clean query params.
 */
export function omitNullish<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== null && v !== undefined),
  ) as Partial<T>;
}
