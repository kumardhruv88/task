import { Prisma, WithdrawalStatus } from "@prisma/client";
import { WithdrawalRepository } from "@/repositories/withdrawal.repo";
import { TransactionRepository } from "@/repositories/transaction.repo";
import { WalletRepository } from "@/repositories/wallet.repo";
import { walletService } from "./wallet.service";
import { auditService } from "./audit.service";
import { WithdrawalTooSoonError, InsufficientBalanceError, EntityNotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export class WithdrawalService {
  constructor(
    private withdrawalRepo: WithdrawalRepository,
    private transactionRepo: TransactionRepository,
    private walletRepo: WalletRepository
  ) {}

  /**
   * Rule 5: Request Withdrawal
   * Only 1 withdrawal every 24 hours. Validates balance and creates locks.
   */
  async requestWithdrawal(affiliateId: string, amount: Prisma.Decimal) {
    return prisma.$transaction(async (tx) => {
      // 1. Enforce 24 hour limit
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentCount = await this.withdrawalRepo.countRecentWithdrawals(affiliateId, twentyFourHoursAgo, tx);
      
      if (recentCount > 0) {
        throw new WithdrawalTooSoonError(affiliateId, new Date(Date.now() + 24 * 60 * 60 * 1000));
      }

      // 2. Enforce sufficient balance
      const wallet = await this.walletRepo.findByAffiliateId(affiliateId, tx);
      if (!wallet) throw new EntityNotFoundError("Wallet", `Affiliate:${affiliateId}`);

      if (wallet.availableBalance.lessThan(amount)) {
        throw new InsufficientBalanceError(affiliateId, amount.toNumber(), wallet.availableBalance.toNumber());
      }

      // 3. Create Withdrawal Request
      const withdrawal = await this.withdrawalRepo.create({
        affiliateId,
        amount,
        paymentMethod: "BANK_TRANSFER", // Sourced from affiliate profile in prod
        status: WithdrawalStatus.PENDING,
      }, tx);

      // 4. Lock Funds in Wallet
      await walletService.recordLedgerEntry({
        affiliateId,
        type: "WITHDRAWAL_LOCK",
        amount,
        description: `Funds locked for withdrawal request ${withdrawal.id}`,
      }, tx);

      await auditService.logAction({
        action: "WITHDRAWAL_REQUESTED",
        entityType: "Withdrawal",
        entityId: withdrawal.id,
        actorType: "USER", // Assuming affiliate maps to user actor or api
        metadata: { amount: amount.toNumber() }
      }, tx);

      logger.info(`Withdrawal requested by affiliate ${affiliateId} for ${amount}`);
      return withdrawal;
    });
  }

  /**
   * Rule 6: Failed Withdrawal Recovery
   * Automatically restores balance, updates ledger, and records audit on failure.
   */
  async handleFailedWithdrawal(withdrawalId: string, failureReason: string) {
    return prisma.$transaction(async (tx) => {
      const withdrawal = await tx.withdrawal.findUnique({ where: { id: withdrawalId } });
      if (!withdrawal) throw new EntityNotFoundError("Withdrawal", withdrawalId);
      
      if (withdrawal.status !== WithdrawalStatus.PROCESSING && withdrawal.status !== WithdrawalStatus.PENDING) {
        return; // Already resolved
      }

      // 1. Mark as failed
      await this.withdrawalRepo.updateStatus(withdrawalId, WithdrawalStatus.FAILED, undefined, failureReason, tx);

      // 2. Unlock Funds (Returns to Available Balance)
      await walletService.recordLedgerEntry({
        affiliateId: withdrawal.affiliateId,
        type: "WITHDRAWAL_UNLOCK",
        amount: withdrawal.amount,
        description: `Unlock funds due to failed withdrawal ${withdrawal.id}. Reason: ${failureReason}`,
      }, tx);

      // 3. Audit Logging
      await auditService.logAction({
        action: "WITHDRAWAL_FAILED",
        entityType: "Withdrawal",
        entityId: withdrawalId,
        actorType: "SYSTEM",
        metadata: { failureReason }
      }, tx);

      logger.warn(`Withdrawal ${withdrawalId} failed and funds unlocked. Reason: ${failureReason}`);
    });
  }
}

export const withdrawalService = new WithdrawalService(new WithdrawalRepository(), new TransactionRepository(), new WalletRepository());
