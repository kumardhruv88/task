import { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api/response";
import { withErrorHandler } from "@/lib/api/error-handler";
import { PaginationQuerySchema, CreateWithdrawalSchema } from "@/lib/validators/api.schema";
import { prisma } from "@/lib/prisma";
import { withdrawalService } from "@/services/withdrawal.service";
import { Prisma } from "@prisma/client";

/**
 * GET /api/withdrawals
 * Returns paginated withdrawals.
 */
export const GET = withErrorHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const queryParams = Object.fromEntries(url.searchParams.entries());
  
  const filters = PaginationQuerySchema.parse(queryParams);
  const skip = (filters.page - 1) * filters.limit;

  const [total, withdrawals] = await Promise.all([
    prisma.withdrawal.count(),
    prisma.withdrawal.findMany({
      skip,
      take: filters.limit,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return apiSuccess({
    items: withdrawals,
    meta: {
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(total / filters.limit),
    },
  });
});

/**
 * POST /api/withdrawals
 * Requests a new withdrawal. Enforces 24h limit & balance checks.
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  const data = CreateWithdrawalSchema.parse(body);

  const amount = new Prisma.Decimal(data.amount);

  const withdrawal = await withdrawalService.requestWithdrawal(data.affiliateId, amount);

  return apiSuccess(withdrawal, "Withdrawal requested successfully", 201);
});
