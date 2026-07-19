import { Prisma, Sale, SaleStatus, AdvancePayout, FinalPayout } from "@prisma/client";
import { prisma, TransactionClient } from "@/lib/prisma";

export class SaleRepository {
  /**
   * Responsibility: Manages Sale records, including retrieving pending sales and updating statuses.
   */

  async findById(id: string, tx?: TransactionClient): Promise<Sale | null> {
    const client = tx || prisma;
    return client.sale.findUnique({ where: { id } });
  }

  async findPendingWithNoAdvance(limit = 100, tx?: TransactionClient): Promise<(Sale & { advancePayout: AdvancePayout | null })[]> {
    const client = tx || prisma;
    return client.sale.findMany({
      where: {
        status: SaleStatus.PENDING,
        advancePayout: null, // Ensuring no advance payout is attached yet
      },
      include: {
        advancePayout: true,
      },
      take: limit,
      orderBy: { createdAt: "asc" },
    });
  }

  async updateStatus(
    id: string,
    status: SaleStatus,
    operatorId?: string,
    rejectionReason?: string,
    tx?: TransactionClient
  ): Promise<Sale> {
    const client = tx || prisma;
    const updateData: Prisma.SaleUpdateInput = { status };

    if (status === SaleStatus.APPROVED) {
      updateData.approvedAt = new Date();
      updateData.approvedBy = operatorId ? { connect: { id: operatorId } } : undefined;
    } else if (status === SaleStatus.REJECTED) {
      updateData.rejectedAt = new Date();
      updateData.rejectedBy = operatorId ? { connect: { id: operatorId } } : undefined;
      updateData.rejectionReason = rejectionReason;
    }

    return client.sale.update({
      where: { id },
      data: updateData,
    });
  }

  async createAdvancePayout(
    data: Prisma.AdvancePayoutUncheckedCreateInput,
    tx?: TransactionClient
  ): Promise<AdvancePayout> {
    const client = tx || prisma;
    return client.advancePayout.create({
      data,
    });
  }

  async createFinalPayout(
    data: Prisma.FinalPayoutUncheckedCreateInput,
    tx?: TransactionClient
  ): Promise<FinalPayout> {
    const client = tx || prisma;
    return client.finalPayout.create({
      data,
    });
  }
}
