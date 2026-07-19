import { Prisma, Wallet, WalletLedger } from "@prisma/client";
import { prisma, TransactionClient } from "@/lib/prisma";

export class WalletRepository {
  /**
   * Responsibility: Manages Wallet balances and Ledger inserts.
   * Employs optimistic locking to prevent double-spend or inconsistent reads.
   */

  async findByAffiliateId(affiliateId: string, tx?: TransactionClient): Promise<Wallet | null> {
    const client = tx || prisma;
    return client.wallet.findUnique({
      where: { affiliateId },
    });
  }

  /**
   * Updates wallet balance using optimistic locking.
   * Returns count of affected rows. If 0, a concurrent modification occurred.
   */
  async updateBalanceOptimistic(
    walletId: string,
    currentVersion: number,
    data: {
      availableBalanceDelta?: Prisma.Decimal;
      lockedBalanceDelta?: Prisma.Decimal;
      lifetimeEarningsDelta?: Prisma.Decimal;
      lifetimeWithdrawnDelta?: Prisma.Decimal;
    },
    tx?: TransactionClient
  ): Promise<number> {
    const client = tx || prisma;

    const updateQuery = await client.$executeRaw`
      UPDATE wallets
      SET 
        "availableBalance" = "availableBalance" + COALESCE(${data.availableBalanceDelta ?? 0}::numeric, 0),
        "lockedBalance" = "lockedBalance" + COALESCE(${data.lockedBalanceDelta ?? 0}::numeric, 0),
        "lifetimeEarnings" = "lifetimeEarnings" + COALESCE(${data.lifetimeEarningsDelta ?? 0}::numeric, 0),
        "lifetimeWithdrawn" = "lifetimeWithdrawn" + COALESCE(${data.lifetimeWithdrawnDelta ?? 0}::numeric, 0),
        "version" = "version" + 1,
        "updatedAt" = NOW()
      WHERE "id" = ${walletId} AND "version" = ${currentVersion}
    `;

    return updateQuery; // 0 if version mismatched, 1 if successful
  }

  async createLedgerEntry(
    data: Prisma.WalletLedgerUncheckedCreateInput,
    tx?: TransactionClient
  ): Promise<WalletLedger> {
    const client = tx || prisma;
    return client.walletLedger.create({
      data,
    });
  }

  /**
   * Recomputes theoretical balance directly from ledger.
   */
  async calculateBalanceFromLedger(walletId: string, tx?: TransactionClient): Promise<Prisma.Decimal> {
    const client = tx || prisma;
    
    // Using Prisma aggregate on WalletLedger
    const credits = await client.walletLedger.aggregate({
      where: {
        walletId,
        type: {
          in: ["ADVANCE_PAYOUT_CREDIT", "FINAL_PAYOUT_CREDIT", "ADJUSTMENT_CREDIT", "REVERSAL_CREDIT", "WITHDRAWAL_UNLOCK"],
        },
      },
      _sum: { amount: true },
    });

    const debits = await client.walletLedger.aggregate({
      where: {
        walletId,
        type: {
          in: ["WITHDRAWAL_LOCK", "ADJUSTMENT_DEBIT"],
        },
      },
      _sum: { amount: true },
    });

    const totalCredits = credits._sum.amount ?? new Prisma.Decimal(0);
    const totalDebits = debits._sum.amount ?? new Prisma.Decimal(0);

    return totalCredits.minus(totalDebits);
  }
}
