"use client";

/**
 * @file lib/theme/provider.tsx
 * next-themes provider wrapper.
 *
 * WHY: next-themes' ThemeProvider uses React context — it must be a Client
 * Component. Wrapping it here keeps the root layout clean and makes the
 * theme configuration a single source of truth.
 *
 * attribute="class" — Tailwind dark mode via `.dark` class on <html>.
 * defaultTheme="system" — respects OS preference on first visit.
 * enableSystem — allows toggling between system/light/dark.
 * disableTransitionOnChange — prevents the flash of unstyled content when
 *   switching themes (transitions interfere with color variable swaps).
 */

import { ThemeProvider as NextThemesProvider } from "next-themes";

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
