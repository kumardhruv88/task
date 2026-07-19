"use client";

/**
 * @file hooks/use-sidebar.ts
 * Hook for managing sidebar open/close state.
 *
 * WHY: AppShell and Topnav both need access to the same sidebar state.
 * A shared hook (rather than prop-drilling or a context) is the simplest
 * solution at this component depth. If state needs to become global,
 * promote it to a Zustand store or React context.
 *
 * Automatically closes the sidebar when the viewport exceeds the
 * mobile breakpoint to avoid a stuck-open state on window resize.
 */

import { useCallback, useEffect, useState } from "react";

import { useMediaQuery } from "@/hooks/use-media-query";

interface UseSidebarReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export function useSidebar(): UseSidebarReturn {
  const [isOpen, setIsOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  // Close mobile sidebar when screen becomes desktop-wide
  useEffect(() => {
    if (isDesktop) {
      setIsOpen(false);
    }
  }, [isDesktop]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, open, close, toggle };
}
