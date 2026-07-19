import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { withErrorHandler } from "@/lib/api/error-handler";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/wallet/:userId
 * Returns wallet balance and recent ledger entries.
 */
export const GET = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ userId: string }> }) => {
  const { userId } = await params;
  
  const wallet = await prisma.wallet.findUnique({ 
    where: { affiliateId: userId },
    include: {
      ledgerEntries: {
        take: 10,
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!wallet) return apiError("Wallet not found", null, 404);

  return apiSuccess(wallet);
});
