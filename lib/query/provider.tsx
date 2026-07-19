"use client";

/**
 * @file lib/query/provider.tsx
 * TanStack Query provider for the application.
 *
 * WHY: QueryClientProvider is a Client Component (uses React context).
 * We wrap it here so the root layout (a Server Component) can import it
 * without pulling all of TanStack Query into the server bundle.
 *
 * A new QueryClient is created per render in development to prevent
 * state sharing between requests. In production, Next.js handles isolation.
 */

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

import { createQueryClient } from "@/lib/query/client";

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Use useState to ensure each component tree gets its own QueryClient.
  // Do NOT use a module-level singleton — that leaks state across requests in SSR.
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools only render in development — zero production impact */}
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
    </QueryClientProvider>
  );
}
