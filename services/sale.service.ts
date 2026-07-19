import { SaleStatus, Prisma } from "@prisma/client";
import { SaleRepository } from "@/repositories/sale.repo";
import { TransactionRepository } from "@/repositories/transaction.repo";
import { walletService } from "./wallet.service";
import { auditService } from "./audit.service";
import { InvalidStatusTransitionError, EntityNotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export class SaleService {
  constructor(private saleRepo: SaleRepository, private transactionRepo: TransactionRepository) {}

  /**
   * Rule 2: Reconciling Approved Sales
   * If a sale is approved, it transitions to APPROVED, and a FinalPayout must be triggered.
   * If a sale is rejected, it transitions to REJECTED, and any AdvancePayout must be reversed.
   */
  async processSaleDecision(
    saleId: string,
    decision: "APPROVE" | "REJECT",
    operatorId: string,
    rejectionReason?: string
  ) {
    return prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        include: { advancePayout: true, finalPayout: true },
      });

      if (!sale) throw new EntityNotFoundError("Sale", saleId);
      if (sale.status !== SaleStatus.PENDING) {
        throw new InvalidStatusTransitionError("Sale", saleId, sale.status, decision);
      }

      if (decision === "APPROVE") {
        await this.saleRepo.updateStatus(saleId, SaleStatus.APPROVED, operatorId, undefined, tx);
        
        // Final Payout creation is handled by PayoutService or a Background Job 
        // that looks for APPROVED sales without a FinalPayout.
        // For atomic safety, we could create the PENDING FinalPayout record here.
        await this.saleRepo.createFinalPayout({
          saleId: sale.id,
          affiliateId: sale.affiliateId,
          amount: sale.finalAmount,
          advanceDeducted: sale.advancePayout ? sale.advanceAmount : new Prisma.Decimal(0),
          status: "PENDING",
        }, tx);

        await auditService.logAction({
          action: "SALE_APPROVED",
          entityType: "Sale",
          entityId: saleId,
          actorType: "USER",
          actorId: operatorId,
        }, tx);

        logger.info(`Sale ${saleId} approved.`);
      } else if (decision === "REJECT") {
        if (!rejectionReason) throw new Error("Rejection reason is required.");
        
        await this.saleRepo.updateStatus(saleId, SaleStatus.REJECTED, operatorId, rejectionReason, tx);

        // Rule 2: Recovery mechanism. If an advance payout exists and was COMPLETED, we must recover it.
        // We create an ADJUSTMENT_DEBIT directly against the wallet to reverse the advance.
        if (sale.advancePayout && sale.advancePayout.status === "COMPLETED") {
          const recoveryTx = await this.transactionRepo.create({
            type: "REVERSAL",
            amount: sale.advanceAmount,
            advancePayoutId: sale.advancePayout.id,
            status: "COMPLETED", // Assuming internal adjustment is immediate
          }, tx);

          await walletService.recordLedgerEntry({
            affiliateId: sale.affiliateId,
            type: "ADJUSTMENT_DEBIT",
            amount: sale.advanceAmount,
            transactionId: recoveryTx.id,
            description: `Recovery of advance payout for rejected sale ${saleId}`,
          }, tx);
        }

        await auditService.logAction({
          action: "SALE_REJECTED",
          entityType: "Sale",
          entityId: saleId,
          actorType: "USER",
          actorId: operatorId,
          metadata: { rejectionReason },
        }, tx);

        logger.info(`Sale ${saleId} rejected.`);
      }
    });
  }
}

export const saleService = new SaleService(new SaleRepository(), new TransactionRepository());
