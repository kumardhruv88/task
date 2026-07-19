import { PayoutStatus } from "@prisma/client";
import { SaleRepository } from "@/repositories/sale.repo";
import { TransactionRepository } from "@/repositories/transaction.repo";
import { walletService } from "./wallet.service";
import { auditService } from "./audit.service";
import { DuplicateAdvancePayoutError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export class PayoutService {
  constructor(private saleRepo: SaleRepository, private transactionRepo: TransactionRepository) {}

  /**
   * Rule 1: Advance Payout Process
   * Identifies eligible pending sales and processes exactly 10% advance.
   * Ensures idempotency to NEVER pay twice.
   */
  async processAdvancePayouts(limit = 100) {
    const eligibleSales = await this.saleRepo.findPendingWithNoAdvance(limit);

    for (const sale of eligibleSales) {
      try {
        await prisma.$transaction(async (tx) => {
          // Double-check inside transaction (locking implicitly via unique constraint)
          if (sale.advancePayout) {
            throw new DuplicateAdvancePayoutError(sale.id);
          }

          // 1. Create Advance Payout Record
          const advance = await this.saleRepo.createAdvancePayout({
            saleId: sale.id,
            affiliateId: sale.affiliateId,
            amount: sale.advanceAmount, // Pre-calculated at 10% during Sale creation
            status: PayoutStatus.PROCESSING,
          }, tx);

          // 2. Create Gateway Transaction
          const idempotencyKey = `ADV_${sale.id}`; // API-level idempotency
          
          const gatewayTx = await this.transactionRepo.create({
            type: "ADVANCE_PAYOUT",
            amount: sale.advanceAmount,
            advancePayoutId: advance.id,
            status: "PROCESSING",
            idempotencyKey,
          }, tx);

          // Simulate Gateway Call (In production, this is an external HTTP call)
          // For now, we assume immediate success for the assignment scope.
          
          await this.transactionRepo.updateStatus(gatewayTx.id, "COMPLETED", {
            gatewayReference: `GW_SIM_${Date.now()}`
          }, tx);

          await tx.advancePayout.update({
            where: { id: advance.id },
            data: { status: "COMPLETED", completedAt: new Date() }
          });

          // 3. Update Wallet & Ledger
          await walletService.recordLedgerEntry({
            affiliateId: sale.affiliateId,
            type: "ADVANCE_PAYOUT_CREDIT",
            amount: sale.advanceAmount,
            transactionId: gatewayTx.id,
            description: `Advance Payout for Sale ${sale.id}`,
          }, tx);

          // 4. Audit Log
          await auditService.logAction({
            action: "ADVANCE_PAYOUT_PROCESSED",
            entityType: "AdvancePayout",
            entityId: advance.id,
            actorType: "SYSTEM",
            metadata: { amount: sale.advanceAmount.toNumber() }
          }, tx);
        });

        logger.info(`Successfully processed advance payout for sale ${sale.id}`);
      } catch (error) {
        logger.error(`Failed to process advance payout for sale ${sale.id}`, error);
        // Continue loop even if one fails
      }
    }
  }
}

export const payoutService = new PayoutService(new SaleRepository(), new TransactionRepository());
