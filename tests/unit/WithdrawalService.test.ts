import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WithdrawalService } from '@/services/withdrawal.service';
import { WithdrawalRepository } from '@/repositories/withdrawal.repo';
import { TransactionRepository } from '@/repositories/transaction.repo';
import { WalletRepository } from '@/repositories/wallet.repo';
import { walletService } from '@/services/wallet.service';
import { auditService } from '@/services/audit.service';
import { Prisma } from '@prisma/client';
import { WithdrawalTooSoonError, InsufficientBalanceError, EntityNotFoundError } from '@/lib/errors';

// Mock dependencies
vi.mock('@/repositories/withdrawal.repo');
vi.mock('@/repositories/transaction.repo');
vi.mock('@/repositories/wallet.repo');
vi.mock('@/services/wallet.service');
vi.mock('@/services/audit.service');

// Mock Prisma transaction
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(async (callback) => {
      const mockTx = {
        withdrawal: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'withdraw-123',
            affiliateId: 'aff-123',
            amount: new Prisma.Decimal(50),
            status: 'PROCESSING',
          }),
        },
      };
      return callback(mockTx);
    }),
  },
}));

describe('WithdrawalService', () => {
  let withdrawalService: WithdrawalService;
  let mockWithdrawalRepo: vi.Mocked<WithdrawalRepository>;
  let mockTransactionRepo: vi.Mocked<TransactionRepository>;
  let mockWalletRepo: vi.Mocked<WalletRepository>;

  beforeEach(() => {
    mockWithdrawalRepo = new WithdrawalRepository() as vi.Mocked<WithdrawalRepository>;
    mockTransactionRepo = new TransactionRepository() as vi.Mocked<TransactionRepository>;
    mockWalletRepo = new WalletRepository() as vi.Mocked<WalletRepository>;
    
    withdrawalService = new WithdrawalService(mockWithdrawalRepo, mockTransactionRepo, mockWalletRepo);
    
    vi.clearAllMocks();
  });

  describe('requestWithdrawal', () => {
    it('throws WithdrawalTooSoonError if a withdrawal was requested in the last 24 hours', async () => {
      mockWithdrawalRepo.countRecentWithdrawals.mockResolvedValue(1);

      await expect(
        withdrawalService.requestWithdrawal('aff-123', new Prisma.Decimal(50))
      ).rejects.toThrow(WithdrawalTooSoonError);
    });

    it('throws EntityNotFoundError if wallet is not found', async () => {
      mockWithdrawalRepo.countRecentWithdrawals.mockResolvedValue(0);
      mockWalletRepo.findByAffiliateId.mockResolvedValue(null);

      await expect(
        withdrawalService.requestWithdrawal('aff-123', new Prisma.Decimal(50))
      ).rejects.toThrow(EntityNotFoundError);
    });

    it('throws InsufficientBalanceError if amount > available balance', async () => {
      mockWithdrawalRepo.countRecentWithdrawals.mockResolvedValue(0);
      mockWalletRepo.findByAffiliateId.mockResolvedValue({
        id: 'wallet-123',
        availableBalance: new Prisma.Decimal(40),
      } as any);

      await expect(
        withdrawalService.requestWithdrawal('aff-123', new Prisma.Decimal(50))
      ).rejects.toThrow(InsufficientBalanceError);
    });

    it('creates a withdrawal and locks funds successfully', async () => {
      mockWithdrawalRepo.countRecentWithdrawals.mockResolvedValue(0);
      mockWalletRepo.findByAffiliateId.mockResolvedValue({
        id: 'wallet-123',
        availableBalance: new Prisma.Decimal(100),
      } as any);

      mockWithdrawalRepo.create.mockResolvedValue({ id: 'withdraw-123' } as any);

      const withdrawal = await withdrawalService.requestWithdrawal('aff-123', new Prisma.Decimal(50));

      expect(withdrawal.id).toBe('withdraw-123');

      // Verify withdrawal creation
      expect(mockWithdrawalRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          affiliateId: 'aff-123',
          amount: new Prisma.Decimal(50),
          status: 'PENDING',
        }),
        expect.anything()
      );

      // Verify wallet lock
      expect(walletService.recordLedgerEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          affiliateId: 'aff-123',
          type: 'WITHDRAWAL_LOCK',
          amount: new Prisma.Decimal(50),
        }),
        expect.anything()
      );

      // Verify audit log
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'WITHDRAWAL_REQUESTED',
          entityId: 'withdraw-123',
        }),
        expect.anything()
      );
    });
  });

  describe('handleFailedWithdrawal', () => {
    it('restores balance and audits failed withdrawal', async () => {
      await withdrawalService.handleFailedWithdrawal('withdraw-123', 'Bank rejected');

      expect(mockWithdrawalRepo.updateStatus).toHaveBeenCalledWith(
        'withdraw-123',
        'FAILED',
        undefined,
        'Bank rejected',
        expect.anything()
      );

      expect(walletService.recordLedgerEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          affiliateId: 'aff-123', // from mocked prisma.$transaction
          type: 'WITHDRAWAL_UNLOCK',
          amount: new Prisma.Decimal(50),
        }),
        expect.anything()
      );

      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'WITHDRAWAL_FAILED',
          entityId: 'withdraw-123',
          metadata: { failureReason: 'Bank rejected' },
        }),
        expect.anything()
      );
    });
  });
});
