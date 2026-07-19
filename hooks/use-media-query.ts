"use client";

/**
 * @file hooks/use-media-query.ts
 * Hook for responsive breakpoint detection.
 *
 * WHY: CSS media queries handle layout. JavaScript media queries handle
 * conditional logic (e.g., auto-closing sidebar, swapping components).
 * This hook bridges the gap with the browser's matchMedia API.
 *
 * SSR safe: Returns false during server-side rendering to avoid hydration
 * mismatches. The correct value is applied after first client render.
 *
 * @example
 * const isMobile = useMediaQuery("(max-width: 767px)");
 * const isDesktop = useMediaQuery("(min-width: 1024px)");
 */

import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    // Return false during SSR — window is not available
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Use addEventListener for modern browsers; addListener is deprecated
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [query]);

  return matches;
}
