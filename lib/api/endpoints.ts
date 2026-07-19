/**
 * Centralized registry of all API endpoints.
 * This prevents typos and makes refactoring easier.
 */
export const ENDPOINTS = {
  // Dashboard & Metrics
  DASHBOARD_METRICS: "/dashboard/metrics",

  // Sales
  SALES: "/sales",
  SALE_DETAILS: (id: string) => `/sales/${id}`,
  SALE_UPDATE_STATUS: (id: string) => `/sales/${id}/status`,

  // Wallet & Ledger
  WALLET_SUMMARY: "/wallet",
  WALLET_LEDGER: "/wallet/ledger",

  // Transactions
  TRANSACTIONS: "/transactions",

  // Withdrawals
  WITHDRAWALS: "/withdrawals",
  
  // Admin & System Jobs
  ADMIN_JOBS: "/admin/jobs",
  ADMIN_RUN_ADVANCE_PAYOUT: "/admin/run-advance-payout-job",
  
  // Reconciliation
  RECONCILIATION: "/reconciliation",
  
  // Health
  HEALTH: "/health",
} as const;
