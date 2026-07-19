import { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api/response";
import { withErrorHandler } from "@/lib/api/error-handler";
import { TransactionFilterSchema } from "@/lib/validators/api.schema";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/transactions
 * Returns paginated and filtered transactions.
 */
export const GET = withErrorHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const queryParams = Object.fromEntries(url.searchParams.entries());
  
  const filters = TransactionFilterSchema.parse(queryParams);
  const skip = (filters.page - 1) * filters.limit;

  const where: any = {};
  if (filters.type) where.type = filters.type;
  if (filters.status) where.status = filters.status;
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
    if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
  }
  
  if (filters.affiliateId) {
    where.OR = [
      { advancePayout: { affiliateId: filters.affiliateId } },
      { finalPayout: { affiliateId: filters.affiliateId } },
      { withdrawal: { affiliateId: filters.affiliateId } }
    ];
  }

  const [total, transactions] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      skip,
      take: filters.limit,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return apiSuccess({
    items: transactions,
    meta: {
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(total / filters.limit),
    },
  });
});
