import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SaleService } from '@/services/sale.service';
import { SaleRepository } from '@/repositories/sale.repo';
import { TransactionRepository } from '@/repositories/transaction.repo';
import { walletService } from '@/services/wallet.service';
import { auditService } from '@/services/audit.service';
import { Prisma, SaleStatus } from '@prisma/client';
import { InvalidStatusTransitionError, EntityNotFoundError } from '@/lib/errors';

vi.mock('@/repositories/sale.repo');
vi.mock('@/repositories/transaction.repo');
vi.mock('@/services/wallet.service');
vi.mock('@/services/audit.service');

const mockFindUnique = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(async (callback) => {
      const mockTx = {
        sale: {
          findUnique: (...args: any[]) => mockFindUnique(...args),
        }
      };
      return callback(mockTx);
    }),
  },
}));

describe('SaleService', () => {
  let saleService: SaleService;
  let mockSaleRepo: vi.Mocked<SaleRepository>;
  let mockTransactionRepo: vi.Mocked<TransactionRepository>;

  beforeEach(() => {
    mockSaleRepo = new SaleRepository() as vi.Mocked<SaleRepository>;
    mockTransactionRepo = new TransactionRepository() as vi.Mocked<TransactionRepository>;
    saleService = new SaleService(mockSaleRepo, mockTransactionRepo);
    vi.clearAllMocks();
  });

  describe('processSaleDecision', () => {
    it('throws EntityNotFoundError if sale does not exist', async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(
        saleService.processSaleDecision('sale-1', 'APPROVE', 'operator-1')
      ).rejects.toThrow(EntityNotFoundError);
    });

    it('throws InvalidStatusTransitionError if sale is not PENDING', async () => {
      mockFindUnique.mockResolvedValue({ id: 'sale-1', status: 'APPROVED' });

      await expect(
        saleService.processSaleDecision('sale-1', 'APPROVE', 'operator-1')
      ).rejects.toThrow(InvalidStatusTransitionError);
    });

    it('handles APPROVE decision correctly', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'sale-1',
        affiliateId: 'aff-1',
        status: 'PENDING',
        finalAmount: new Prisma.Decimal(90),
        advanceAmount: new Prisma.Decimal(10),
        advancePayout: { id: 'adv-1', status: 'COMPLETED' },
      });

      await saleService.processSaleDecision('sale-1', 'APPROVE', 'operator-1');

      expect(mockSaleRepo.updateStatus).toHaveBeenCalledWith(
        'sale-1',
        'APPROVED',
        'operator-1',
        undefined,
        expect.anything()
      );

      expect(mockSaleRepo.createFinalPayout).toHaveBeenCalledWith(
        expect.objectContaining({
          saleId: 'sale-1',
          affiliateId: 'aff-1',
          amount: new Prisma.Decimal(90),
          advanceDeducted: new Prisma.Decimal(10),
          status: 'PENDING',
        }),
        expect.anything()
      );

      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SALE_APPROVED',
          entityId: 'sale-1',
        }),
        expect.anything()
      );
    });

    it('throws Error if REJECT decision lacks reason', async () => {
      mockFindUnique.mockResolvedValue({ id: 'sale-1', status: 'PENDING' });

      await expect(
        saleService.processSaleDecision('sale-1', 'REJECT', 'operator-1')
      ).rejects.toThrow("Rejection reason is required.");
    });

    it('handles REJECT decision and recovers completed advance payout', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'sale-1',
        affiliateId: 'aff-1',
        status: 'PENDING',
        advanceAmount: new Prisma.Decimal(10),
        advancePayout: { id: 'adv-1', status: 'COMPLETED' },
      });

      mockTransactionRepo.create.mockResolvedValue({ id: 'tx-reversal' } as any);

      await saleService.processSaleDecision('sale-1', 'REJECT', 'operator-1', 'Fraud');

      expect(mockSaleRepo.updateStatus).toHaveBeenCalledWith(
        'sale-1',
        'REJECTED',
        'operator-1',
        'Fraud',
        expect.anything()
      );

      expect(mockTransactionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'REVERSAL',
          amount: new Prisma.Decimal(10),
          advancePayoutId: 'adv-1',
        }),
        expect.anything()
      );

      expect(walletService.recordLedgerEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          affiliateId: 'aff-1',
          type: 'ADJUSTMENT_DEBIT',
          amount: new Prisma.Decimal(10),
          transactionId: 'tx-reversal',
        }),
        expect.anything()
      );

      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SALE_REJECTED',
          entityId: 'sale-1',
        }),
        expect.anything()
      );
    });

    it('handles REJECT decision without recovering if advance payout is not completed', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'sale-1',
        affiliateId: 'aff-1',
        status: 'PENDING',
        advanceAmount: new Prisma.Decimal(10),
        advancePayout: { id: 'adv-1', status: 'PROCESSING' }, // Not completed
      });

      await saleService.processSaleDecision('sale-1', 'REJECT', 'operator-1', 'Fraud');

      expect(mockSaleRepo.updateStatus).toHaveBeenCalledWith(
        'sale-1',
        'REJECTED',
        'operator-1',
        'Fraud',
        expect.anything()
      );

      // Reversal should NOT happen
      expect(mockTransactionRepo.create).not.toHaveBeenCalled();
      expect(walletService.recordLedgerEntry).not.toHaveBeenCalled();
    });
  });
});
