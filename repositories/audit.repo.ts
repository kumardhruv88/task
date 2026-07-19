import { Prisma, AuditLog, AuditActorType } from "@prisma/client";
import { prisma, TransactionClient } from "@/lib/prisma";

export class AuditRepository {
  /**
   * Responsibility: Provides an append-only interface to write immutable audit logs.
   */

  async createLog(
    data: Omit<Prisma.AuditLogUncheckedCreateInput, "createdAt" | "id">,
    tx?: TransactionClient
  ): Promise<AuditLog> {
    const client = tx || prisma;
    return client.auditLog.create({
      data,
    });
  }
}
