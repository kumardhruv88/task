import { z } from "zod";
import { WithdrawalStatus, TransactionType, TransactionStatus, SaleStatus } from "@prisma/client";

// --- Pagination & Filtering Schemas ---

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const SaleFilterSchema = PaginationQuerySchema.extend({
  status: z.nativeEnum(SaleStatus).optional(),
  brandId: z.string().uuid().optional(),
  affiliateId: z.string().uuid().optional(),
  search: z.string().optional(),
});

export const TransactionFilterSchema = PaginationQuerySchema.extend({
  type: z.nativeEnum(TransactionType).optional(),
  status: z.nativeEnum(TransactionStatus).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  affiliateId: z.string().uuid().optional(),
});

// --- Body Schemas ---

export const CreateSaleSchema = z.object({
  brandId: z.string().uuid(),
  affiliateId: z.string().uuid(),
  externalOrderId: z.string().min(1),
  saleAmount: z.number().positive(),
  commissionRate: z.number().min(0).max(1),
  advanceRate: z.number().min(0).max(1),
});

export const UpdateSaleStatusSchema = z.object({
  status: z.enum([SaleStatus.APPROVED, SaleStatus.REJECTED]),
  rejectionReason: z.string().optional().refine((val) => {
    return true; // We validate reason presence strictly in the handler if REJECTED
  }),
});

export const CreateWithdrawalSchema = z.object({
  affiliateId: z.string().uuid(),
  amount: z.number().positive(),
});

export const UpdateWithdrawalStatusSchema = z.object({
  status: z.nativeEnum(WithdrawalStatus),
  reason: z.string().optional(),
});
