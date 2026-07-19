/**
 * @file types/index.ts
 * Global TypeScript type definitions shared across the entire application.
 * Domain-specific types live here until they warrant their own file.
 *
 * Rules:
 * - No business logic — types only.
 * - Prefer `interface` for object shapes (extendable), `type` for unions/aliases.
 * - Re-export from here; consumers import from "@/types".
 */

// ─── HTTP / API Response Envelope ─────────────────────────────────────────────

/** Standard success response wrapper for all API route handlers. */
export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

/** Standard error response wrapper for all API route handlers. */
export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: Record<string, string[]>; // Zod field errors
}

/** Union of success and error response — return type for route handlers. */
export type ApiResult<T = unknown> = ApiResponse<T> | ApiErrorResponse;

/** Paginated list response wrapper. */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/** Query params for paginated requests. */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export type UserRole = "ADMIN" | "MANAGER" | "VIEWER";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  avatarUrl: string | null;
}

// ─── Affiliate ────────────────────────────────────────────────────────────────

export type AffiliateStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING";

export interface Affiliate {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: AffiliateStatus;
  referralCode: string;
  totalEarnings: number;
  pendingPayout: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Payout ───────────────────────────────────────────────────────────────────

export type PayoutStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type PayoutMethod = "BANK_TRANSFER" | "UPI" | "PAYPAL" | "CRYPTO";

export interface Payout {
  id: string;
  affiliateId: string;
  affiliate: Pick<Affiliate, "id" | "name" | "email">;
  amount: number;
  currency: string;
  status: PayoutStatus;
  method: PayoutMethod;
  referenceId: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export interface DashboardStats {
  totalAffiliates: number;
  activeAffiliates: number;
  totalPayoutsThisMonth: number;
  pendingPayouts: number;
  totalEarningsThisMonth: number;
  pendingPayoutAmount: number;
}

// ─── UI Utilities ─────────────────────────────────────────────────────────────

/** Used by sidebar and navigation components. */
export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  children?: NavItem[];
}

/** Generic select option for dropdowns. */
export interface SelectOption<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
}

/** Column definition for data tables. */
export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}
