/**
 * @file lib/constants/index.ts
 * Application-wide constants. No magic strings or numbers scattered in code.
 *
 * WHY: Centralizing constants makes them searchable, refactorable, and
 * self-documenting. Every value here should have a comment explaining its
 * origin or constraint.
 */

// ─── App Identity ─────────────────────────────────────────────────────────────

export const APP_NAME = "Affiliate Payout System" as const;
export const APP_DESCRIPTION =
  "Manage affiliate partners, track commissions, and process payouts at scale." as const;

// ─── Pagination ───────────────────────────────────────────────────────────────

/** Default number of rows per page in all data tables. */
export const DEFAULT_PAGE_SIZE = 20 as const;

/** Maximum rows per page — used in API validation to prevent abuse. */
export const MAX_PAGE_SIZE = 100 as const;

// ─── Payout ───────────────────────────────────────────────────────────────────

/** Minimum payout amount in INR — prevents micro-payouts that cost more to process. */
export const MIN_PAYOUT_AMOUNT_INR = 100 as const;

/** Maximum single payout amount in INR — anything higher requires manual approval. */
export const MAX_PAYOUT_AMOUNT_INR = 500_000 as const;

/** Supported currencies with their display labels. */
export const SUPPORTED_CURRENCIES = [
  { value: "INR", label: "Indian Rupee (₹)" },
  { value: "USD", label: "US Dollar ($)" },
  { value: "EUR", label: "Euro (€)" },
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]["value"];

// ─── Date / Time ──────────────────────────────────────────────────────────────

/** Standard date format used across the app for display. */
export const DATE_FORMAT = "dd MMM yyyy" as const;

/** Standard date-time format for audit logs and timestamps. */
export const DATETIME_FORMAT = "dd MMM yyyy, HH:mm" as const;

// ─── Routes ───────────────────────────────────────────────────────────────────

/** All application route paths. Centralised to prevent typos. */
export const ROUTES = {
  // Auth
  LOGIN: "/login",
  REGISTER: "/register",

  // Dashboard
  DASHBOARD: "/dashboard",
  AFFILIATES: "/dashboard/affiliates",
  AFFILIATE_DETAIL: (id: string) => `/dashboard/affiliates/${id}`,
  PAYOUTS: "/dashboard/payouts",
  PAYOUT_DETAIL: (id: string) => `/dashboard/payouts/${id}`,
  REPORTS: "/dashboard/reports",
  SETTINGS: "/dashboard/settings",

  // API
  API_AFFILIATES: "/api/affiliates",
  API_PAYOUTS: "/api/payouts",
} as const;

// ─── Query Keys ───────────────────────────────────────────────────────────────

/**
 * TanStack Query cache keys — centralised so cache invalidations are
 * never duplicated or mismatched across components.
 */
export const QUERY_KEYS = {
  AFFILIATES: ["affiliates"] as const,
  AFFILIATE: (id: string) => ["affiliates", id] as const,
  PAYOUTS: ["payouts"] as const,
  PAYOUT: (id: string) => ["payouts", id] as const,
  DASHBOARD_STATS: ["dashboard", "stats"] as const,
} as const;
