/**
 * @file lib/config/env.ts
 * Type-safe access to environment variables.
 *
 * WHY: Raw `process.env.X` is `string | undefined`. Accessing it anywhere
 * silently fails at runtime. Validating once at module load time surfaces
 * misconfiguration immediately on startup, not mid-request.
 *
 * USAGE: Import `env` instead of `process.env` in server-side code.
 * For client-side public vars, use `clientEnv`.
 */

import { z } from "zod";

// ─── Server-side env schema (never sent to browser) ───────────────────────────

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),
  NEXTAUTH_SECRET: z.string().min(32, "NEXTAUTH_SECRET must be at least 32 characters"),
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL").optional(),
});

// ─── Client-side env schema (NEXT_PUBLIC_ prefix, safe for browser) ───────────

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_NAME: z.string().default("Affiliate Payout System"),
});

// ─── Parse and export ─────────────────────────────────────────────────────────

/**
 * Server-only environment config.
 * Throws at module load time if any required variable is missing.
 * Import this only in server components, route handlers, and services.
 */
function parseServerEnv() {
  const result = serverEnvSchema.safeParse(process.env);

  if (!result.success) {
    const missing = result.error.issues
      .map((issue) => `  • ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `❌ Invalid environment variables:\n${missing}\n\nCheck your .env file against .env.example`,
    );
  }

  return result.data;
}

/**
 * Client-safe environment config.
 * Contains only NEXT_PUBLIC_ variables.
 */
function parseClientEnv() {
  const result = clientEnvSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  });

  // Client env failures are non-fatal — fall back to defaults
  return result.success ? result.data : clientEnvSchema.parse({});
}

// Only validate server env on the server side to avoid breaking client bundles
export const env = typeof window === "undefined" ? parseServerEnv() : ({} as ReturnType<typeof parseServerEnv>);
export const clientEnv = parseClientEnv();
