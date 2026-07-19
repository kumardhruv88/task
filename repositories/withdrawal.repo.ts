import { Prisma, Withdrawal, WithdrawalStatus, WithdrawalAttempt } from "@prisma/client";
import { prisma, TransactionClient } from "@/lib/prisma";

export class WithdrawalRepository {
  /**
   * Responsibility: Manages Withdrawal lifecycle and limits.
   */

  async countRecentWithdrawals(
    affiliateId: string,
    since: Date,
    tx?: TransactionClient
  ): Promise<number> {
    const client = tx || prisma;
    return client.withdrawal.count({
      where: {
        affiliateId,
        createdAt: { gte: since },
        status: {
          notIn: [WithdrawalStatus.CANCELLED, WithdrawalStatus.REJECTED],
        },
      },
    });
  }

  async findById(id: string, tx?: TransactionClient): Promise<Withdrawal | null> {
    const client = tx || prisma;
    return client.withdrawal.findUnique({
      where: { id },
    });
  }

  async create(data: Prisma.WithdrawalUncheckedCreateInput, tx?: TransactionClient): Promise<Withdrawal> {
    const client = tx || prisma;
    return client.withdrawal.create({
      data,
    });
  }

  async updateStatus(
    id: string,
    status: WithdrawalStatus,
    operatorId?: string,
    reason?: string,
    tx?: TransactionClient
  ): Promise<Withdrawal> {
    const client = tx || prisma;
    const updateData: Prisma.WithdrawalUpdateInput = { status };

    if (status === WithdrawalStatus.COMPLETED) {
      updateData.completedAt = new Date();
    } else if (status === WithdrawalStatus.REJECTED) {
      updateData.rejectedAt = new Date();
      updateData.rejectedById = operatorId;
      updateData.rejectionReason = reason;
    }

    return client.withdrawal.update({
      where: { id },
      data: updateData,
    });
  }

  async createAttempt(
    data: Prisma.WithdrawalAttemptUncheckedCreateInput,
    tx?: TransactionClient
  ): Promise<WithdrawalAttempt> {
    const client = tx || prisma;
    return client.withdrawalAttempt.create({ data });
  }
}
