import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReconciliationService } from '@/services/reconciliation.service';
import { WalletRepository } from '@/repositories/wallet.repo';
import { walletService } from '@/services/wallet.service';
import { auditService } from '@/services/audit.service';
import { Prisma } from '@prisma/client';

vi.mock('@/repositories/wallet.repo');
vi.mock('@/services/wallet.service');
vi.mock('@/services/audit.service');

const mockFindMany = vi.fn();
const mockReconciliationCreate = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    wallet: {
      findMany: (...args: any[]) => mockFindMany(...args),
    },
    reconciliation: {
      create: (...args: any[]) => mockReconciliationCreate(...args),
    },
    $transaction: vi.fn(async (callback) => {
      const mockTx = {};
      return callback(mockTx);
    }),
  },
}));

describe('ReconciliationService', () => {
  let reconciliationService: ReconciliationService;
  let mockWalletRepo: vi.Mocked<WalletRepository>;

  beforeEach(() => {
    mockWalletRepo = new WalletRepository() as vi.Mocked<WalletRepository>;
    reconciliationService = new ReconciliationService(mockWalletRepo);
    
    vi.clearAllMocks();
  });

  describe('runNightlyReconciliation', () => {
    it('does not adjust wallet when balance matches ledger', async () => {
      mockFindMany.mockResolvedValue([
        { id: 'wallet-1', affiliateId: 'aff-1', availableBalance: new Prisma.Decimal(100) }
      ]);
      mockWalletRepo.calculateBalanceFromLedger.mockResolvedValue(new Prisma.Decimal(100));

      await reconciliationService.runNightlyReconciliation();

      expect(walletService.recordLedgerEntry).not.toHaveBeenCalled();
      expect(auditService.logAction).not.toHaveBeenCalled();
      
      expect(mockReconciliationCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            discrepanciesFound: 0,
            discrepanciesResolved: 0,
            totalWalletsChecked: 1,
          })
        })
      );
    });

    it('injects ADJUSTMENT_CREDIT when theoretical balance > actual balance', async () => {
      mockFindMany.mockResolvedValue([
        { id: 'wallet-1', affiliateId: 'aff-1', availableBalance: new Prisma.Decimal(100) }
      ]);
      // Ledger says it should be 120. (Missing funds)
      mockWalletRepo.calculateBalanceFromLedger.mockResolvedValue(new Prisma.Decimal(120));

      await reconciliationService.runNightlyReconciliation();

      expect(walletService.recordLedgerEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          affiliateId: 'aff-1',
          type: 'ADJUSTMENT_CREDIT',
          amount: new Prisma.Decimal(20), // 120 - 100 = 20 missing
        }),
        expect.anything()
      );

      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'WALLET_RECONCILED',
          entityId: 'wallet-1',
        }),
        expect.anything()
      );

      expect(mockReconciliationCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            discrepanciesFound: 1,
            discrepanciesResolved: 1,
          })
        })
      );
    });

    it('injects ADJUSTMENT_DEBIT when theoretical balance < actual balance', async () => {
      mockFindMany.mockResolvedValue([
        { id: 'wallet-1', affiliateId: 'aff-1', availableBalance: new Prisma.Decimal(100) }
      ]);
      // Ledger says it should be 80. (Extra funds)
      mockWalletRepo.calculateBalanceFromLedger.mockResolvedValue(new Prisma.Decimal(80));

      await reconciliationService.runNightlyReconciliation();

      expect(walletService.recordLedgerEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          affiliateId: 'aff-1',
          type: 'ADJUSTMENT_DEBIT',
          amount: new Prisma.Decimal(20), // 100 - 80 = 20 extra
        }),
        expect.anything()
      );

      expect(mockReconciliationCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            discrepanciesFound: 1,
            discrepanciesResolved: 1,
          })
        })
      );
    });
  });
});
