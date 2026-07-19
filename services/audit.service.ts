import { Prisma, AuditActorType } from "@prisma/client";
import { AuditRepository } from "@/repositories/audit.repo";
import { logger } from "@/lib/logger";
import { TransactionClient } from "@/lib/prisma";

export class AuditService {
  constructor(private auditRepo: AuditRepository) {}

  async logAction(
    params: {
      action: string;
      entityType: string;
      entityId: string;
      actorType: AuditActorType;
      actorId?: string;
      oldValues?: Record<string, any>;
      newValues?: Record<string, any>;
      metadata?: Record<string, any>;
    },
    tx?: TransactionClient
  ) {
    try {
      const log = await this.auditRepo.createLog(
        {
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          actorType: params.actorType,
          actorId: params.actorId,
          oldValues: params.oldValues as Prisma.InputJsonValue,
          newValues: params.newValues as Prisma.InputJsonValue,
          metadata: params.metadata as Prisma.InputJsonValue,
        },
        tx
      );
      logger.info(`Audit Log: ${params.action} on ${params.entityType} ${params.entityId}`);
      return log;
    } catch (error) {
      // We log the error but don't strictly throw to avoid crashing the main transaction
      // if it's just an audit logging failure, though ideally it should succeed.
      logger.error("Failed to write audit log", error, { action: params.action });
      throw error;
    }
  }
}

export const auditService = new AuditService(new AuditRepository());
