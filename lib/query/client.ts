/**
 * @file lib/query/client.ts
 * Configured TanStack Query client with production-appropriate defaults.
 *
 * WHY: The default QueryClient settings are optimised for demos, not production.
 * - staleTime: 0 means every component mount refetches — too aggressive for a
 *   fintech dashboard where data changes on a controlled schedule.
 * - retry: 3 on a 401 means 3 wasted requests before the user sees an error.
 *
 * These defaults can be overridden per-query when needed.
 */

import { QueryClient } from "@tanstack/react-query";

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered fresh for 60 seconds — reduces unnecessary refetches
        // on tab focus without making the UI feel stale.
        staleTime: 60 * 1000,

        // Keep unused query data in cache for 5 minutes before garbage collecting.
        gcTime: 5 * 60 * 1000,

        // Only retry once on failure; financial data failures should surface fast.
        retry: 1,

        // Retry after 1 second on first failure.
        retryDelay: 1000,

        // Refetch on window focus in production, disabled in dev to avoid noise.
        refetchOnWindowFocus: process.env.NODE_ENV === "production",

        // Do not refetch on reconnect by default — user should manually refresh.
        refetchOnReconnect: false,
      },
      mutations: {
        // Surface mutation errors immediately — no retries on write operations.
        retry: 0,
      },
    },
  });
}
