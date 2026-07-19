import { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api/response";
import { withErrorHandler } from "@/lib/api/error-handler";
import { PaginationQuerySchema } from "@/lib/validators/api.schema";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/jobs
 * Returns a paginated list of background system jobs.
 */
export const GET = withErrorHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const queryParams = Object.fromEntries(url.searchParams.entries());
  
  const filters = PaginationQuerySchema.parse(queryParams);
  const skip = (filters.page - 1) * filters.limit;

  const [total, jobs] = await Promise.all([
    prisma.systemJob.count(),
    prisma.systemJob.findMany({
      skip,
      take: filters.limit,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return apiSuccess({
    items: jobs,
    meta: {
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(total / filters.limit),
    },
  });
});
