/**
 * @file app/loading.tsx
 * Root-level Suspense loading UI.
 *
 * This renders while the root layout's children are loading.
 * It must be visually compatible with both light and dark themes
 * since next-themes hasn't applied the theme class yet at this point.
 */

import { Skeleton } from "@/components/ui/skeleton";

export default function RootLoading() {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar skeleton */}
      <aside className="bg-sidebar hidden w-64 shrink-0 flex-col border-r p-4 lg:flex">
        {/* Logo area */}
        <div className="mb-8 flex items-center gap-3 px-2 py-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-5 w-32" />
        </div>

        {/* Nav items */}
        <div className="flex flex-col gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>

        {/* Bottom user area */}
        <div className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex flex-col gap-1">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topnav skeleton */}
        <header className="flex h-14 items-center justify-between border-b px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-lg lg:hidden" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </header>

        {/* Page content skeleton */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <div className="mb-6">
            <Skeleton className="mb-2 h-7 w-48" />
            <Skeleton className="h-4 w-80" />
          </div>

          {/* Stats cards */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl border p-5">
                <div className="mb-3 flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-9 w-9 rounded-lg" />
                </div>
                <Skeleton className="mb-1 h-7 w-32" />
                <Skeleton className="h-3.5 w-20" />
              </div>
            ))}
          </div>

          {/* Table skeleton */}
          <div className="bg-card rounded-xl border">
            <div className="border-b p-4">
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="mb-1.5 h-4 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-5 w-24" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
