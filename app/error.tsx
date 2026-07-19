"use client";

/**
 * @file app/error.tsx
 * Root error boundary — catches unhandled errors in the entire route tree.
 *
 * MUST be a Client Component — Next.js error boundaries use React's
 * componentDidCatch which requires client-side rendering.
 *
 * This is the last resort fallback. Prefer more specific error.tsx files
 * at nested route segments (e.g., app/(dashboard)/error.tsx) for better
 * scoped recovery.
 */

import { AlertCircle, RefreshCw } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // TODO: Log to error tracking service (e.g., Sentry) in future
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="bg-destructive/10 mb-6 flex h-16 w-16 items-center justify-center rounded-full">
        <AlertCircle className="text-destructive h-8 w-8" />
      </div>

      <h1 className="mb-2 text-2xl font-semibold tracking-tight">Something went wrong</h1>

      <p className="text-muted-foreground mb-1 max-w-md text-sm">
        An unexpected error occurred. If this persists, contact support.
      </p>

      {/* Show error digest in production for support reference */}
      {error.digest && (
        <p className="text-muted-foreground mb-6 font-mono text-xs">
          Error ID: {error.digest}
        </p>
      )}

      {/* Show detailed message in development only */}
      {process.env.NODE_ENV === "development" && (
        <pre className="bg-muted mb-6 max-w-lg overflow-auto rounded-lg p-4 text-left text-xs">
          {error.message}
          {error.stack && `\n\n${error.stack}`}
        </pre>
      )}

      <div className="flex gap-3">
        <Button onClick={reset} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
        <Button variant="outline" onClick={() => (window.location.href = "/")}>
          Go home
        </Button>
      </div>
    </div>
  );
}
