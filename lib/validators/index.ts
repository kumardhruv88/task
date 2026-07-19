/**
 * @file lib/validators/index.ts
 * Shared Zod validation schemas used across API route handlers and forms.
 *
 * WHY: Collocating schemas prevents drift between client-side form validation
 * and server-side API validation. The same schema validates both sides.
 *
 * Pattern: `<Entity>Schema` for full shapes, `Create<Entity>Schema` /
 * `Update<Entity>Schema` for mutations, `<Entity>QuerySchema` for search params.
 */

import { z } from "zod";

// ─── Common ───────────────────────────────────────────────────────────────────

/** Validates standard pagination query params. */
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

/** Validates a CUID2 or UUID string as an entity ID. */
export const IdParamSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

// ─── Affiliate ────────────────────────────────────────────────────────────────

export const CreateAffiliateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .regex(/^\+?[0-9]{10,15}$/, "Invalid phone number")
    .optional()
    .or(z.literal("")),
});

export type CreateAffiliateInput = z.infer<typeof CreateAffiliateSchema>;

export const UpdateAffiliateSchema = CreateAffiliateSchema.partial().extend({
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
});

export type UpdateAffiliateInput = z.infer<typeof UpdateAffiliateSchema>;

export const AffiliateQuerySchema = PaginationQuerySchema.extend({
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING"]).optional(),
  search: z.string().optional(),
});

export type AffiliateQuery = z.infer<typeof AffiliateQuerySchema>;

// ─── Payout ───────────────────────────────────────────────────────────────────

export const CreatePayoutSchema = z.object({
  affiliateId: z.string().min(1, "Affiliate is required"),
  amount: z
    .number()
    .positive("Amount must be positive")
    .min(100, "Minimum payout amount is ₹100"),
  currency: z.enum(["INR", "USD", "EUR"]).default("INR"),
  method: z.enum(["BANK_TRANSFER", "UPI", "PAYPAL", "CRYPTO"]),
  notes: z.string().max(500).optional(),
});

export type CreatePayoutInput = z.infer<typeof CreatePayoutSchema>;

export const PayoutQuerySchema = PaginationQuerySchema.extend({
  status: z
    .enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"])
    .optional(),
  affiliateId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type PayoutQuery = z.infer<typeof PayoutQuerySchema>;
