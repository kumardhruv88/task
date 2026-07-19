import { QueryClient } from "@tanstack/react-query";

/**
 * Cache Strategy definitions as per requirements:
 * Dashboard → 30 seconds
 * Wallet → 10 seconds
 * Transactions → 30 seconds
 * Sales → 30 seconds
 * Admin → 60 seconds
 * Health → 2 minutes
 */

export const CACHE_TIMES = {
  DASHBOARD: 30 * 1000,
  WALLET: 10 * 1000,
  TRANSACTIONS: 30 * 1000,
  SALES: 30 * 1000,
  ADMIN: 60 * 1000,
  HEALTH: 120 * 1000,
} as const;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // Default to 30 seconds if unspecified
      refetchOnWindowFocus: true, // Keep data fresh on return
      retry: (failureCount, error: any) => {
        // Do not retry 4xx errors (client errors)
        if (error?.statusCode >= 400 && error?.statusCode < 500) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});
