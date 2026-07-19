import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { withErrorHandler } from "@/lib/api/error-handler";
import { UpdateSaleStatusSchema } from "@/lib/validators/api.schema";
import { saleService } from "@/services/sale.service";
import { SaleStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/sales/:id
 * Fetches a single sale by ID.
 */
export const GET = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const sale = await prisma.sale.findUnique({ where: { id }, include: { advancePayout: true, finalPayout: true } });
  if (!sale) return apiError("Sale not found", null, 404);
  return apiSuccess(sale);
});

/**
 * PATCH /api/sales/:id
 * Approves or rejects a sale.
 */
export const PATCH = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const body = await req.json();
  const data = UpdateSaleStatusSchema.parse(body);

  const operatorId = req.headers.get("x-operator-id") || "system"; // Mocked auth
  
  const decision = data.status === SaleStatus.APPROVED ? "APPROVE" : "REJECT";
  if (decision === "REJECT" && !data.rejectionReason) {
    return apiError("Rejection reason is required", null, 400);
  }

  await saleService.processSaleDecision(id, decision, operatorId, data.rejectionReason);

  return apiSuccess(null, `Sale ${id} processed successfully`);
});

/**
 * DELETE /api/sales/:id
 * Soft deletes a sale (Not implemented in schema as soft delete is only for Users/Affiliates).
 * But we return 405 Method Not Allowed as it breaks financial immutability.
 */
export const DELETE = withErrorHandler(async () => {
  return apiError("Sales cannot be deleted to preserve financial integrity.", null, 405);
});
