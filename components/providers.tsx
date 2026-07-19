"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";

import { queryClient } from "@/lib/query/queryClient";

export function Providers({ children }: { children: React.ReactNode }) {
  // Use the singleton instance since we're in a client component that is rendered once at the root.
  // If SSR was heavily used for queries, we'd instantiate it per-request, but for a pure SPA dashboard, this is fine.
  const [client] = useState(() => queryClient);

  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster position="top-right" richColors />
      </QueryClientProvider>
    </NextThemesProvider>
  );
}
