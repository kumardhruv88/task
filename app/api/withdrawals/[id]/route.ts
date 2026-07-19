import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { withErrorHandler } from "@/lib/api/error-handler";
import { UpdateWithdrawalStatusSchema } from "@/lib/validators/api.schema";
import { withdrawalService } from "@/services/withdrawal.service";
import { prisma } from "@/lib/prisma";
import { WithdrawalStatus } from "@prisma/client";

/**
 * PATCH /api/withdrawals/:id
 * Allows admin to change status. Triggers recovery if failed/rejected/cancelled.
 */
export const PATCH = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const body = await req.json();
  const data = UpdateWithdrawalStatusSchema.parse(body);

  const operatorId = req.headers.get("x-operator-id") || "system"; // Mocked auth
  
  // 1. If it's a failure state, we use the service's dedicated recovery handler
  if (data.status === WithdrawalStatus.FAILED || data.status === WithdrawalStatus.REJECTED || data.status === WithdrawalStatus.CANCELLED) {
    const reason = data.reason || `Status changed to ${data.status} by operator`;
    await withdrawalService.handleFailedWithdrawal(id, reason);
    return apiSuccess(null, `Withdrawal ${id} marked as failed and funds recovered.`);
  }
  
  // 2. Otherwise just update status normally (e.g. PROCESSING, COMPLETED)
  const withdrawal = await prisma.withdrawal.findUnique({ where: { id } });
  if (!withdrawal) return apiError("Withdrawal not found", null, 404);

  const updateData: any = { status: data.status };
  
  if (data.status === WithdrawalStatus.COMPLETED) {
    updateData.completedAt = new Date();
    // A real app would write a WITHDRAWAL_DEBIT ledger entry here since it succeeded.
    // For simplicity in this scope, we just update the status.
  }

  const updated = await prisma.withdrawal.update({
    where: { id },
    data: updateData,
  });

  return apiSuccess(updated, `Withdrawal ${id} status updated to ${data.status}`);
});
