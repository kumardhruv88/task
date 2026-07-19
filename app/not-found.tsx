/**
 * @file app/not-found.tsx
 * 404 Not Found page — rendered when no route matches the URL.
 *
 * Server Component — no interactivity needed beyond navigation links.
 */

import { FileQuestion } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="bg-muted mb-6 flex h-16 w-16 items-center justify-center rounded-full">
        <FileQuestion className="text-muted-foreground h-8 w-8" />
      </div>

      <h1 className="mb-2 text-2xl font-semibold tracking-tight">Page not found</h1>

      <p className="text-muted-foreground mb-8 max-w-sm text-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      <Button asChild>
        <Link href={ROUTES.DASHBOARD}>Return to dashboard</Link>
      </Button>
    </div>
  );
}
