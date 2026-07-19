import { ReconciliationStatus, ReconciliationType, Prisma } from "@prisma/client";
import { WalletRepository } from "@/repositories/wallet.repo";
import { auditService } from "./audit.service";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { walletService } from "./wallet.service";

export class ReconciliationService {
  constructor(private walletRepo: WalletRepository) {}

  /**
   * Rule 2 & 3: Wallet Reconciliation
   * Checks every wallet to ensure availableBalance exactly matches the sum of its ledger entries.
   * If a discrepancy is found, applies adjustments automatically.
   */
  async runNightlyReconciliation() {
    logger.info("Starting nightly wallet reconciliation job");
    
    // In a real system, you would paginate over all active wallets.
    // Assuming limited scope here for assignment brevity.
    const wallets = await prisma.wallet.findMany();
    let discrepanciesFound = 0;
    let discrepanciesResolved = 0;

    for (const wallet of wallets) {
      try {
        await prisma.$transaction(async (tx) => {
          const theoreticalBalance = await this.walletRepo.calculateBalanceFromLedger(wallet.id, tx);
          const actualBalance = wallet.availableBalance;

          if (!theoreticalBalance.equals(actualBalance)) {
            discrepanciesFound++;
            logger.warn(`Discrepancy found for Wallet ${wallet.id}. Theoretical: ${theoreticalBalance.toNumber()}, Actual: ${actualBalance.toNumber()}`);

            const difference = theoreticalBalance.minus(actualBalance);

            // Automatically resolve by injecting an adjustment
            if (difference.greaterThan(0)) {
              // Theoretical is higher, wallet is missing funds (Credit)
              await walletService.recordLedgerEntry({
                affiliateId: wallet.affiliateId,
                type: "ADJUSTMENT_CREDIT",
                amount: difference,
                description: "System automatic reconciliation credit",
              }, tx);
            } else {
              // Theoretical is lower, wallet has extra funds (Debit)
              await walletService.recordLedgerEntry({
                affiliateId: wallet.affiliateId,
                type: "ADJUSTMENT_DEBIT",
                amount: difference.negated(),
                description: "System automatic reconciliation debit",
              }, tx);
            }

            discrepanciesResolved++;
            
            await auditService.logAction({
              action: "WALLET_RECONCILED",
              entityType: "Wallet",
              entityId: wallet.id,
              actorType: "SYSTEM",
              metadata: { theoreticalBalance: theoreticalBalance.toNumber(), actualBalance: actualBalance.toNumber(), difference: difference.toNumber() }
            }, tx);
          }
        });
      } catch (error) {
        logger.error(`Reconciliation failed for wallet ${wallet.id}`, error);
      }
    }

    // Record the overall reconciliation run
    await prisma.reconciliation.create({
      data: {
        type: ReconciliationType.SCHEDULED,
        status: ReconciliationStatus.COMPLETED,
        startedAt: new Date(),
        completedAt: new Date(),
        periodStart: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours (simplified)
        periodEnd: new Date(),
        totalWalletsChecked: wallets.length,
        discrepanciesFound,
        discrepanciesResolved,
      }
    });

    logger.info(`Reconciliation complete. Checked: ${wallets.length}. Found: ${discrepanciesFound}. Resolved: ${discrepanciesResolved}.`);
  }
}

export const reconciliationService = new ReconciliationService(new WalletRepository());
