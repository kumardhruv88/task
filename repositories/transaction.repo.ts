import { Prisma, Transaction, TransactionStatus } from "@prisma/client";
import { prisma, TransactionClient } from "@/lib/prisma";

export class TransactionRepository {
  /**
   * Responsibility: Manages Gateway Transactions tracking money movements.
   */

  async create(data: Prisma.TransactionUncheckedCreateInput, tx?: TransactionClient): Promise<Transaction> {
    const client = tx || prisma;
    return client.transaction.create({
      data,
    });
  }

  async updateStatus(
    id: string,
    status: TransactionStatus,
    data: {
      gatewayReference?: string;
      gatewayResponse?: Prisma.InputJsonValue;
      failureReason?: string;
      failureCode?: string;
    },
    tx?: TransactionClient
  ): Promise<Transaction> {
    const client = tx || prisma;
    return client.transaction.update({
      where: { id },
      data: {
        status,
        ...data,
      },
    });
  }

  async findByIdempotencyKey(key: string, tx?: TransactionClient): Promise<Transaction | null> {
    const client = tx || prisma;
    return client.transaction.findUnique({
      where: { idempotencyKey: key },
    });
  }
}
