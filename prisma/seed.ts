import "dotenv/config";
import { UserRole, AffiliateStatus, SaleStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("Seeding database...");

  // 1. Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.walletLedger.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.finalPayout.deleteMany();
  await prisma.advancePayout.deleteMany();
  await prisma.withdrawal.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.affiliate.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Users
  const admin = await prisma.user.create({
    data: {
      email: "admin@fintech.com",
      name: "System Admin",
      passwordHash: "dummy-hash-123",
      role: UserRole.SUPER_ADMIN,
    },
  });

  const affiliateUser = await prisma.user.create({
    data: {
      email: "affiliate@fintech.com",
      name: "Top Affiliate",
      passwordHash: "dummy-hash-123",
      role: UserRole.VIEWER,
    },
  });

  // 3. Create Brand
  const brand = await prisma.brand.create({
    data: {
      name: "Acme Corp SaaS",
      slug: "acme-corp-saas",
      commissionRate: 0.15,
      metadata: {
        logoUrl: "https://example.com/logo.png",
        websiteUrl: "https://example.com",
      }
    },
  });

  // 4. Create Affiliate
  const affiliate = await prisma.affiliate.create({
    data: {
      name: affiliateUser.name,
      email: "affiliate-data@fintech.com", // separate from user
      referralCode: "ref-top-affiliate",
      status: AffiliateStatus.ACTIVE,
    },
  });

  // 5. Create Wallet
  const wallet = await prisma.wallet.create({
    data: {
      affiliateId: affiliate.id,
      availableBalance: 0,
      lockedBalance: 0,
      lifetimeEarnings: 0,
      lifetimeWithdrawn: 0,
    },
  });

  // 6. Create Sales & Payouts (Simulating past history)
  console.log("Generating 50 random sales...");
  for (let i = 0; i < 50; i++) {
    const isApproved = Math.random() > 0.3; // 70% approved, 30% pending
    const amount = Math.floor(Math.random() * 1000) + 100;
    const commission = amount * 0.2;
    const advance = commission * 0.1;

    const finalAmt = commission - advance;

    const sale = await prisma.sale.create({
      data: {
        affiliateId: affiliate.id,
        brandId: brand.id,
        externalOrderId: `EXT-${Date.now()}-${i}`,
        saleAmount: amount,
        commissionRate: 0.2000,
        commissionAmount: commission,
        advanceRate: 0.1000,
        advanceAmount: advance,
        finalAmount: finalAmt,
        status: isApproved ? SaleStatus.APPROVED : SaleStatus.PENDING,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      }
    });

    // Advance Payout
    const advancePayout = await prisma.advancePayout.create({
      data: {
        saleId: sale.id,
        affiliateId: affiliate.id,
        amount: advance,
        status: "COMPLETED",
      }
    });

    // Wallet entry for advance
    await prisma.walletLedger.create({
      data: {
        walletId: wallet.id,
        type: "ADVANCE_PAYOUT_CREDIT",
        amount: advance,
        runningBalance: 0, // This gets calculated dynamically in real app
        description: `Advance for sale ${sale.id}`,
      }
    });

    if (isApproved) {
      await prisma.finalPayout.create({
        data: {
          saleId: sale.id,
          affiliateId: affiliate.id,
          amount: finalAmt,
          advanceDeducted: advance,
          status: "COMPLETED",
        }
      });

      // Wallet entry for final
      await prisma.walletLedger.create({
        data: {
          walletId: wallet.id,
          type: "FINAL_PAYOUT_CREDIT",
          amount: finalAmt,
          runningBalance: 0, // This gets calculated dynamically in real app
          description: `Final payout for sale ${sale.id}`,
        }
      });
    }
  }

  // Recalculate wallet balance to match ledger exactly (simulating actual runtime behavior)
  const ledgers = await prisma.walletLedger.findMany({ where: { walletId: wallet.id }, orderBy: { createdAt: 'asc' } });
  let balance = 0;
  for (const ledger of ledgers) {
    balance += ledger.amount.toNumber();
    await prisma.walletLedger.update({
      where: { id: ledger.id },
      data: { runningBalance: balance }
    });
  }

  await prisma.wallet.update({
    where: { id: wallet.id },
    data: {
      availableBalance: balance,
      lifetimeEarnings: balance, // simplified
    }
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
