import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PayoutService } from '@/services/payout.service';
import { SaleRepository } from '@/repositories/sale.repo';
import { TransactionRepository } from '@/repositories/transaction.repo';
import { walletService } from '@/services/wallet.service';
import { auditService } from '@/services/audit.service';
import { Prisma } from '@prisma/client';

// Mock dependencies
vi.mock('@/repositories/sale.repo');
vi.mock('@/repositories/transaction.repo');
vi.mock('@/services/wallet.service');
vi.mock('@/services/audit.service');

// Mock Prisma transaction
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(async (callback) => {
      // Simulate transaction execution
      const mockTx = {
        advancePayout: {
          update: vi.fn().mockResolvedValue({}),
        },
      };
      return callback(mockTx);
    }),
  },
}));

describe('PayoutService', () => {
  let payoutService: PayoutService;
  let mockSaleRepo: vi.Mocked<SaleRepository>;
  let mockTransactionRepo: vi.Mocked<TransactionRepository>;

  beforeEach(() => {
    mockSaleRepo = new SaleRepository() as vi.Mocked<SaleRepository>;
    mockTransactionRepo = new TransactionRepository() as vi.Mocked<TransactionRepository>;
    payoutService = new PayoutService(mockSaleRepo, mockTransactionRepo);
    
    vi.clearAllMocks();
  });

  describe('processAdvancePayouts', () => {
    it('processes exactly 10% advance payout for eligible sales', async () => {
      // Setup mock data
      const sale = {
        id: 'sale-123',
        affiliateId: 'aff-123',
        amount: new Prisma.Decimal(100), // Original sale amount
        advanceAmount: new Prisma.Decimal(10), // Pre-calculated 10%
        advancePayout: null, // No advance payout yet
      };

      mockSaleRepo.findPendingWithNoAdvance.mockResolvedValue([sale as any]);
      
      const advance = { id: 'adv-123' };
      mockSaleRepo.createAdvancePayout.mockResolvedValue(advance as any);
      
      const gatewayTx = { id: 'tx-123' };
      mockTransactionRepo.create.mockResolvedValue(gatewayTx as any);

      // Execute
      await payoutService.processAdvancePayouts(1);

      // Verify SaleRepo finds eligible sales
      expect(mockSaleRepo.findPendingWithNoAdvance).toHaveBeenCalledWith(1);

      // Verify AdvancePayout creation
      expect(mockSaleRepo.createAdvancePayout).toHaveBeenCalledWith(
        expect.objectContaining({
          saleId: 'sale-123',
          affiliateId: 'aff-123',
          amount: new Prisma.Decimal(10),
          status: 'PROCESSING',
        }),
        expect.anything() // Transaction client
      );

      // Verify Transaction creation
      expect(mockTransactionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ADVANCE_PAYOUT',
          amount: new Prisma.Decimal(10),
          advancePayoutId: 'adv-123',
          idempotencyKey: 'ADV_sale-123',
        }),
        expect.anything()
      );

      // Verify Wallet update
      expect(walletService.recordLedgerEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          affiliateId: 'aff-123',
          type: 'ADVANCE_PAYOUT_CREDIT',
          amount: new Prisma.Decimal(10),
        }),
        expect.anything()
      );

      // Verify Audit Log
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ADVANCE_PAYOUT_PROCESSED',
          entityId: 'adv-123',
        }),
        expect.anything()
      );
    });

    it('rejects processing if sale already has an advance payout (Idempotency)', async () => {
      const sale = {
        id: 'sale-456',
        affiliateId: 'aff-123',
        amount: new Prisma.Decimal(100),
        advanceAmount: new Prisma.Decimal(10),
        advancePayout: { id: 'existing-adv-123' }, // Already exists
      };

      mockSaleRepo.findPendingWithNoAdvance.mockResolvedValue([sale as any]);

      await payoutService.processAdvancePayouts(1);

      // If DuplicateAdvancePayoutError is thrown inside the try-catch loop,
      // it should be caught and logged, not crash the process.
      // Therefore, the loop continues, but creation shouldn't happen.
      
      expect(mockSaleRepo.createAdvancePayout).not.toHaveBeenCalled();
      expect(mockTransactionRepo.create).not.toHaveBeenCalled();
      expect(walletService.recordLedgerEntry).not.toHaveBeenCalled();
    });
  });
});
