import { apiSuccess } from "@/lib/api/response";
import { withErrorHandler } from "@/lib/api/error-handler";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/dashboard/metrics
 * Returns aggregated metrics for the dashboard overview.
 */
export const GET = withErrorHandler(async () => {
  const [
    totalAffiliates,
    pendingSales,
    walletAgg,
    recentTransactions,
    monthlySales,
  ] = await Promise.all([
    // Total active affiliates
    prisma.affiliate.count({ where: { status: "ACTIVE" } }),

    // Pending sales count
    prisma.sale.count({ where: { status: "PENDING" } }),

    // Sum of all wallet available balances
    prisma.wallet.aggregate({
      _sum: { availableBalance: true, lifetimeEarnings: true },
    }),

    // Last 10 transactions
    prisma.transaction.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
    }),

    // Approved sales grouped by month (last 6 months)
    prisma.sale.findMany({
      where: {
        status: "APPROVED",
        createdAt: {
          gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
        },
      },
      select: { createdAt: true, commissionAmount: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Aggregate sales into monthly buckets
  const salesMap = new Map<string, number>();
  for (const sale of monthlySales) {
    const month = sale.createdAt.toISOString().slice(0, 7); // "YYYY-MM"
    const current = salesMap.get(month) || 0;
    salesMap.set(month, current + Number(sale.commissionAmount));
  }

  const salesData = Array.from(salesMap.entries()).map(([date, amount]) => ({
    date,
    amount,
  }));

  return apiSuccess({
    totalRevenue: Number(walletAgg._sum.lifetimeEarnings ?? 0),
    availableBalance: Number(walletAgg._sum.availableBalance ?? 0),
    pendingSales,
    totalAffiliates,
    salesData,
    recentTransactions,
  });
});
