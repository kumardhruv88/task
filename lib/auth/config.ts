/**
 * @file lib/auth/config.ts
 * NextAuth v5 (Auth.js) configuration placeholder.
 *
 * WHY: This file exists to define the shape of the auth configuration and
 * establish the import path convention. The actual providers, callbacks,
 * and database adapter will be implemented in a future prompt.
 *
 * NextAuth v5 requires this config to be imported in:
 * - `auth.ts` (root) — exports auth(), signIn(), signOut(), handlers
 * - `app/api/auth/[...nextauth]/route.ts` — mounts the HTTP handlers
 * - Middleware — for route protection
 *
 * IMPORTANT: Do NOT import this file in Client Components.
 * Use the session from useSession() (next-auth/react) on the client side.
 */

import type { NextAuthConfig } from "next-auth";

/**
 * Base NextAuth config that is safe to share with Edge middleware.
 * Must NOT include the Prisma adapter (not Edge-compatible).
 * Providers are added in the full auth.ts config.
 */
export const authConfig: NextAuthConfig = {
  // Pages are configured here so middleware can redirect correctly
  pages: {
    signIn: "/login",
    error: "/login",
  },

  // Authorization callbacks — controls which routes require authentication
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isDashboardRoute = nextUrl.pathname.startsWith("/dashboard");

      if (isDashboardRoute) {
        // Require auth for all dashboard routes
        return isLoggedIn;
      }

      // Public routes are always accessible
      return true;
    },

    // Future: Enrich JWT with user role from database
    // jwt({ token, user }) { ... }

    // Future: Expose role in session for client components
    // session({ session, token }) { ... }
  },

  // Providers are intentionally empty here — configured in root auth.ts
  // to avoid importing secrets in Edge-compatible config.
  providers: [],
};
