import { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api/response";
import { withErrorHandler } from "@/lib/api/error-handler";
import { SaleFilterSchema, CreateSaleSchema } from "@/lib/validators/api.schema";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * GET /api/sales
 * Returns paginated, filtered, and sorted sales.
 */
export const GET = withErrorHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const queryParams = Object.fromEntries(url.searchParams.entries());
  
  const filters = SaleFilterSchema.parse(queryParams);
  const skip = (filters.page - 1) * filters.limit;

  const where: any = {};
  if (filters.status) where.status = filters.status;
  if (filters.brandId) where.brandId = filters.brandId;
  if (filters.affiliateId) where.affiliateId = filters.affiliateId;
  if (filters.search) {
    where.OR = [
      { externalOrderId: { contains: filters.search, mode: "insensitive" } },
      { id: { contains: filters.search, mode: "insensitive" } }
    ];
  }

  const [total, sales] = await Promise.all([
    prisma.sale.count({ where }),
    prisma.sale.findMany({
      where,
      skip,
      take: filters.limit,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return apiSuccess({
    items: sales,
    meta: {
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(total / filters.limit),
    },
  });
});

/**
 * POST /api/sales
 * Creates a new pending sale (usually called via webhook from Brand integration).
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  const data = CreateSaleSchema.parse(body);

  const saleAmount = new Prisma.Decimal(data.saleAmount);
  const commissionRate = new Prisma.Decimal(data.commissionRate);
  const advanceRate = new Prisma.Decimal(data.advanceRate);

  // Business logic for initial calculation
  const commissionAmount = saleAmount.mul(commissionRate);
  const advanceAmount = commissionAmount.mul(advanceRate);
  const finalAmount = commissionAmount.minus(advanceAmount);

  const sale = await prisma.sale.create({
    data: {
      brandId: data.brandId,
      affiliateId: data.affiliateId,
      externalOrderId: data.externalOrderId,
      saleAmount,
      commissionRate,
      commissionAmount,
      advanceRate,
      advanceAmount,
      finalAmount,
      status: "PENDING"
    }
  });

  return apiSuccess(sale, "Sale created successfully", 201);
});
