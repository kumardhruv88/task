import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WalletService } from '@/services/wallet.service';
import { WalletRepository } from '@/repositories/wallet.repo';
import { Prisma } from '@prisma/client';
import { ConcurrentModificationError, EntityNotFoundError } from '@/lib/errors';

vi.mock('@/lib/prisma', () => {
  return {
    prisma: {}, // We mock WalletRepository, so we don't strictly need the prisma mock methods here, just prevent evaluation
  };
});

// Mock dependencies
vi.mock('@/repositories/wallet.repo');

describe('WalletService', () => {
  let walletService: WalletService;
  let mockWalletRepo: vi.Mocked<WalletRepository>;
  let mockTx: any;

  beforeEach(() => {
    mockWalletRepo = new WalletRepository() as vi.Mocked<WalletRepository>;
    walletService = new WalletService(mockWalletRepo);
    mockTx = {}; // Mock transaction client
  });

  describe('recordLedgerEntry', () => {
    it('throws EntityNotFoundError if wallet does not exist', async () => {
      mockWalletRepo.findByAffiliateId.mockResolvedValue(null);

      await expect(
        walletService.recordLedgerEntry(
          {
            affiliateId: 'aff-123',
            type: 'ADVANCE_PAYOUT_CREDIT',
            amount: new Prisma.Decimal(10),
            description: 'Test',
          },
          mockTx
        )
      ).rejects.toThrow(EntityNotFoundError);
    });

    it('throws ConcurrentModificationError if optimistic update fails', async () => {
      mockWalletRepo.findByAffiliateId.mockResolvedValue({
        id: 'wallet-123',
        affiliateId: 'aff-123',
        availableBalance: new Prisma.Decimal(100),
        lockedBalance: new Prisma.Decimal(0),
        lifetimeEarnings: new Prisma.Decimal(100),
        lifetimeWithdrawn: new Prisma.Decimal(0),
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Simulate version mismatch (returns 0 affected rows)
      mockWalletRepo.updateBalanceOptimistic.mockResolvedValue(0);

      await expect(
        walletService.recordLedgerEntry(
          {
            affiliateId: 'aff-123',
            type: 'ADVANCE_PAYOUT_CREDIT',
            amount: new Prisma.Decimal(10),
            description: 'Test',
          },
          mockTx
        )
      ).rejects.toThrow(ConcurrentModificationError);
    });

    it('correctly updates balance and creates ledger entry for ADVANCE_PAYOUT_CREDIT', async () => {
      mockWalletRepo.findByAffiliateId.mockResolvedValue({
        id: 'wallet-123',
        affiliateId: 'aff-123',
        availableBalance: new Prisma.Decimal(100),
        lockedBalance: new Prisma.Decimal(0),
        lifetimeEarnings: new Prisma.Decimal(100),
        lifetimeWithdrawn: new Prisma.Decimal(0),
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockWalletRepo.updateBalanceOptimistic.mockResolvedValue(1);
      mockWalletRepo.createLedgerEntry.mockResolvedValue({} as any);

      const runningBalance = await walletService.recordLedgerEntry(
        {
          affiliateId: 'aff-123',
          type: 'ADVANCE_PAYOUT_CREDIT',
          amount: new Prisma.Decimal(15),
          description: 'Advance',
        },
        mockTx
      );

      // Verify running balance calculated correctly (100 + 15 = 115)
      expect(runningBalance.toNumber()).toBe(115);

      // Verify repository was called with correct deltas
      expect(mockWalletRepo.updateBalanceOptimistic).toHaveBeenCalledWith(
        'wallet-123',
        1,
        expect.objectContaining({
          availableBalanceDelta: new Prisma.Decimal(15),
          lockedBalanceDelta: new Prisma.Decimal(0),
          lifetimeEarningsDelta: new Prisma.Decimal(15),
          lifetimeWithdrawnDelta: new Prisma.Decimal(0),
        }),
        mockTx
      );

      // Verify ledger entry creation
      expect(mockWalletRepo.createLedgerEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          walletId: 'wallet-123',
          type: 'ADVANCE_PAYOUT_CREDIT',
          amount: new Prisma.Decimal(15),
          runningBalance: new Prisma.Decimal(115),
          description: 'Advance',
        }),
        mockTx
      );
    });

    it('correctly handles WITHDRAWAL_LOCK (moves available to locked)', async () => {
      mockWalletRepo.findByAffiliateId.mockResolvedValue({
        id: 'wallet-123',
        affiliateId: 'aff-123',
        availableBalance: new Prisma.Decimal(100),
        lockedBalance: new Prisma.Decimal(0),
        lifetimeEarnings: new Prisma.Decimal(100),
        lifetimeWithdrawn: new Prisma.Decimal(0),
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockWalletRepo.updateBalanceOptimistic.mockResolvedValue(1);
      mockWalletRepo.createLedgerEntry.mockResolvedValue({} as any);

      await walletService.recordLedgerEntry(
        {
          affiliateId: 'aff-123',
          type: 'WITHDRAWAL_LOCK',
          amount: new Prisma.Decimal(50),
          description: 'Lock funds',
        },
        mockTx
      );

      expect(mockWalletRepo.updateBalanceOptimistic).toHaveBeenCalledWith(
        'wallet-123',
        1,
        expect.objectContaining({
          availableBalanceDelta: new Prisma.Decimal(-50), // Available decreases
          lockedBalanceDelta: new Prisma.Decimal(50),     // Locked increases
          lifetimeEarningsDelta: new Prisma.Decimal(0),
          lifetimeWithdrawnDelta: new Prisma.Decimal(0),
        }),
        mockTx
      );
    });

    it('correctly handles WITHDRAWAL_DEBIT (deducts locked, adds to lifetime withdrawn)', async () => {
      mockWalletRepo.findByAffiliateId.mockResolvedValue({
        id: 'wallet-123',
        affiliateId: 'aff-123',
        availableBalance: new Prisma.Decimal(50),
        lockedBalance: new Prisma.Decimal(50),
        lifetimeEarnings: new Prisma.Decimal(100),
        lifetimeWithdrawn: new Prisma.Decimal(0),
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockWalletRepo.updateBalanceOptimistic.mockResolvedValue(1);
      mockWalletRepo.createLedgerEntry.mockResolvedValue({} as any);

      await walletService.recordLedgerEntry(
        {
          affiliateId: 'aff-123',
          type: 'WITHDRAWAL_DEBIT',
          amount: new Prisma.Decimal(50),
          description: 'Withdrawal success',
        },
        mockTx
      );

      expect(mockWalletRepo.updateBalanceOptimistic).toHaveBeenCalledWith(
        'wallet-123',
        1,
        expect.objectContaining({
          availableBalanceDelta: new Prisma.Decimal(0),
          lockedBalanceDelta: new Prisma.Decimal(-50), // Locked decreases
          lifetimeEarningsDelta: new Prisma.Decimal(0),
          lifetimeWithdrawnDelta: new Prisma.Decimal(50), // Lifetime withdrawn increases
        }),
        mockTx
      );
    });
  });
});
