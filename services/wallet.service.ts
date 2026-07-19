import { Prisma, LedgerEntryType } from "@prisma/client";
import { WalletRepository } from "@/repositories/wallet.repo";
import { ConcurrentModificationError, EntityNotFoundError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { TransactionClient } from "@/lib/prisma";

export class WalletService {
  constructor(private walletRepo: WalletRepository) {}

  /**
   * Rule 3: Guarantee Wallet Consistency
   * Updates balance and writes to ledger in the SAME transaction.
   * Uses optimistic locking. If version mismatch occurs, throws ConcurrentModificationError.
   */
  async recordLedgerEntry(
    params: {
      affiliateId: string;
      type: LedgerEntryType;
      amount: Prisma.Decimal;
      transactionId?: string;
      description: string;
      metadata?: Record<string, any>;
    },
    tx: TransactionClient
  ) {
    const wallet = await this.walletRepo.findByAffiliateId(params.affiliateId, tx);
    if (!wallet) throw new EntityNotFoundError("Wallet", `Affiliate:${params.affiliateId}`);

    let availableDelta = new Prisma.Decimal(0);
    let lockedDelta = new Prisma.Decimal(0);
    let lifetimeEarningsDelta = new Prisma.Decimal(0);
    let lifetimeWithdrawnDelta = new Prisma.Decimal(0);

    // Determine balance impact based on LedgerEntryType
    switch (params.type) {
      case "ADVANCE_PAYOUT_CREDIT":
      case "FINAL_PAYOUT_CREDIT":
      case "ADJUSTMENT_CREDIT":
      case "REVERSAL_CREDIT":
        availableDelta = params.amount;
        if (params.type !== "REVERSAL_CREDIT") {
            lifetimeEarningsDelta = params.amount;
        }
        break;
      case "WITHDRAWAL_LOCK":
        availableDelta = params.amount.negated();
        lockedDelta = params.amount;
        break;
      case "WITHDRAWAL_UNLOCK":
        availableDelta = params.amount;
        lockedDelta = params.amount.negated();
        break;
      case "WITHDRAWAL_DEBIT":
        lockedDelta = params.amount.negated();
        lifetimeWithdrawnDelta = params.amount;
        break;
      case "ADJUSTMENT_DEBIT":
        availableDelta = params.amount.negated();
        break;
      default:
        throw new Error(`Unsupported LedgerEntryType: ${params.type}`);
    }

    // Attempt optimistic update
    const affected = await this.walletRepo.updateBalanceOptimistic(
      wallet.id,
      wallet.version,
      {
        availableBalanceDelta: availableDelta,
        lockedBalanceDelta: lockedDelta,
        lifetimeEarningsDelta: lifetimeEarningsDelta,
        lifetimeWithdrawnDelta: lifetimeWithdrawnDelta,
      },
      tx
    );

    if (affected === 0) {
      throw new ConcurrentModificationError("Wallet", wallet.id);
    }

    const runningBalance = wallet.availableBalance.plus(availableDelta);

    // Append to ledger
    await this.walletRepo.createLedgerEntry(
      {
        walletId: wallet.id,
        transactionId: params.transactionId,
        type: params.type,
        amount: params.amount,
        runningBalance,
        description: params.description,
        metadata: params.metadata as Prisma.InputJsonValue,
      },
      tx
    );

    logger.info(`Wallet Ledger Entry Created`, {
      walletId: wallet.id,
      type: params.type,
      amount: params.amount.toNumber(),
    });

    return runningBalance;
  }
}

export const walletService = new WalletService(new WalletRepository());
