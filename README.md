# Affiliate User Payout Management System

> **SDE Intern Assignment** — Full-stack implementation of a User Payout Management System with advance payouts, reconciliation, and withdrawal management.

**Live at:** `http://localhost:8542` (run `npm run dev`)

---

## Table of Contents
1. [Problem Statement](#problem-statement)
2. [Low-Level Design (LLD)](#low-level-design)
3. [Database Schema](#database-schema)
4. [Class / Service Design](#class--service-design)
5. [API Endpoints](#api-endpoints)
6. [Edge Cases & Failure Handling](#edge-cases--failure-handling)
7. [Key Design Decisions & Trade-offs](#key-design-decisions--trade-offs)
8. [Running the Project](#running-the-project)

---

## Problem Statement

Every sale enters the system with status `PENDING`. The system must:

1. **Advance Payout** — Pay 10% of commission immediately on PENDING sales (idempotent)
2. **Reconciliation** — Admin approves/rejects sales; compute final payouts
   - Approved: final payout = commission − advance
   - Rejected: deduct advance from affiliate's future payout
3. **Withdrawal** — Affiliate can withdraw once every 24 hours

---

## Low-Level Design

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js 16 App                          │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │  Frontend    │    │  API Routes  │    │   Services    │  │
│  │  (React 19)  │◄──►│  (Route     │◄──►│  (Business    │  │
│  │  TanStack    │    │   Handlers) │    │   Logic)      │  │
│  │  Query       │    └──────┬───────┘    └───────┬───────┘  │
│  └──────────────┘           │                    │          │
└────────────────────────────┼────────────────────┼──────────┘
                             │                    │
                    ┌────────▼────────┐  ┌────────▼────────┐
                    │  Repositories   │  │  Repositories   │
                    │  (Data Access)  │  │  (Data Access)  │
                    └────────┬────────┘  └────────┬────────┘
                             │                    │
                    ┌────────▼────────────────────▼────────┐
                    │        PostgreSQL (Supabase)           │
                    │   Prisma ORM v7 + pg adapter          │
                    └──────────────────────────────────────┘
```

### Core State Machines

**Sale Lifecycle:**
```
PENDING ──(admin approves)──► APPROVED ──► FinalPayout created
        ──(admin rejects)───► REJECTED ──► Advance recovery debit
```

**Withdrawal Lifecycle:**
```
PENDING ──► PROCESSING ──► COMPLETED
        │               └──► FAILED ──► funds unlocked (WITHDRAWAL_UNLOCK)
        └──► CANCELLED ──────────────► funds unlocked
```

**Advance Payout Flow:**
```
Sale created (PENDING)
        │
        ▼
Batch Job runs
        │
        ├─ Find all PENDING sales WHERE advancePayout IS NULL
        ├─ BEGIN TRANSACTION
        │   ├─ INSERT advance_payouts (fails silently if @unique saleId exists)
        │   ├─ INSERT wallet_ledger (ADVANCE_PAYOUT_CREDIT)
        │   └─ UPDATE wallet.availableBalance
        └─ COMMIT
```

---

## Database Schema

16 tables covering all financial entities. Key design:

```prisma
model Sale {
  id              String     @id @default(cuid())
  affiliateId     String
  brandId         String
  externalOrderId String     @unique    // Webhook idempotency
  saleAmount      Decimal    @db.Decimal(12, 2)
  commissionRate  Decimal    @db.Decimal(5, 4)   // Snapshot — never changes
  commissionAmount Decimal   @db.Decimal(12, 2)
  advanceRate     Decimal    @db.Decimal(5, 4)   // Snapshot
  advanceAmount   Decimal    @db.Decimal(12, 2)  // Pre-computed: commission × 10%
  finalAmount     Decimal    @db.Decimal(12, 2)  // Pre-computed: commission - advance
  status          SaleStatus @default(PENDING)
  advancePayout   AdvancePayout?  // @unique enforces 1 advance max
  finalPayout     FinalPayout?
}

model AdvancePayout {
  id          String @id @default(cuid())
  saleId      String @unique    // ← DATABASE-LEVEL idempotency guarantee
  affiliateId String
  amount      Decimal @db.Decimal(12, 2)
  status      PayoutStatus @default(PENDING)
}

model WalletLedger {
  // Immutable — no updatedAt
  id             String          @id @default(cuid())
  walletId       String
  type           LedgerEntryType  // ADVANCE_PAYOUT_CREDIT | FINAL_PAYOUT_CREDIT | WITHDRAWAL_LOCK | etc.
  amount         Decimal         @db.Decimal(12, 2)  // Always positive
  runningBalance Decimal         @db.Decimal(12, 2)  // Point-in-time balance snapshot
  description    String
  createdAt      DateTime        @default(now())
  // NO updatedAt — entries are permanent
}

model Wallet {
  id               String  @id @default(cuid())
  affiliateId      String  @unique
  availableBalance Decimal @db.Decimal(12, 2)
  lockedBalance    Decimal @db.Decimal(12, 2)  // Funds reserved by withdrawal
  lifetimeEarnings Decimal @db.Decimal(12, 2)  // Monotonically increasing
  version          Int     @default(0)          // Optimistic locking
}
```

**Full schema:** [`prisma/schema.prisma`](./prisma/schema.prisma)

### Entity Relationships

```
User ──────────────────────────────────────────────────────────┐
                                                               │ approves/rejects
Brand ─────────────────────────────────────────────────────────┤
        │ commissionRate snapshot                              │
        ▼                                                      ▼
     Sale ─────────────────────────────────────────────────► Sale
       │                                                    (state machine)
       ├──1:0..1──► AdvancePayout ──► Transaction
       └──1:0..1──► FinalPayout   ──► Transaction

Affiliate
   └──1:1──► Wallet
                └──1:N──► WalletLedger (immutable append-only)
   └──1:N──► Withdrawal ──► WithdrawalAttempt
```

---

## Class / Service Design

### Services (Business Logic Layer)

| Service | Responsibility |
|---------|---------------|
| `PayoutService` | Process advance payouts in batches with idempotency |
| `SaleService` | Approve/reject sales; trigger final payout creation |
| `WalletService` | Atomic balance mutations + ledger entries |
| `WithdrawalService` | Withdrawal lifecycle; 24h cooldown; fund locking |
| `ReconciliationService` | Nightly wallet balance verification + auto-correction |
| `AuditService` | Append-only audit log for every financial action |

### Key Method: `PayoutService.processAdvancePayouts()`

```typescript
async processAdvancePayouts(limit = 100) {
  // 1. Find all PENDING sales with no advance payout yet
  const eligibleSales = await this.saleRepo.findPendingWithNoAdvance(limit);

  for (const sale of eligibleSales) {
    await prisma.$transaction(async (tx) => {
      // 2. Create AdvancePayout — UNIQUE constraint on saleId prevents duplicates
      const advance = await tx.advancePayout.create({
        data: { saleId: sale.id, amount: sale.advanceAmount, status: "PROCESSING" }
      });
      // 3. Simulate gateway call
      // 4. Credit wallet + insert immutable ledger entry
      await walletService.recordLedgerEntry({
        type: "ADVANCE_PAYOUT_CREDIT",
        amount: sale.advanceAmount,
        affiliateId: sale.affiliateId,
      }, tx);
    });
  }
}
```

### Key Method: `WalletService.recordLedgerEntry()`

```typescript
async recordLedgerEntry({ affiliateId, type, amount, description }, tx) {
  // Uses optimistic locking — retries on version mismatch
  const wallet = await tx.wallet.findUniqueOrThrow({ where: { affiliateId } });
  
  const newBalance = type.includes("CREDIT")
    ? wallet.availableBalance.add(amount)
    : wallet.availableBalance.sub(amount);

  // Atomic: update balance AND insert ledger entry together
  await tx.wallet.update({
    where: { id: wallet.id, version: wallet.version },  // Optimistic lock
    data: { availableBalance: newBalance, version: { increment: 1 } }
  });

  await tx.walletLedger.create({
    data: { walletId: wallet.id, type, amount, runningBalance: newBalance, description }
  });
}
```

---

## API Endpoints

Base URL: `http://localhost:8542/api`

### Sales
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/sales` | List sales (paginated, filterable by status/brand/search) |
| `POST` | `/sales` | Create sale (brand webhook — idempotent via externalOrderId) |
| `GET` | `/sales/:id` | Get sale details |
| `POST` | `/sales/:id/status` | Approve or Reject a sale |

**POST /sales example:**
```json
{
  "affiliateId": "cmr...",
  "brandId": "cmr...",
  "externalOrderId": "ORD-12345",
  "saleAmount": 1000,
  "commissionRate": 0.20,
  "advanceRate": 0.10
}
```
**Response:**
```json
{
  "status": "PENDING",
  "commissionAmount": "200.00",
  "advanceAmount": "20.00",     // 10% of commission
  "finalAmount": "180.00"       // 90% remaining
}
```

### Wallet
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/wallet/:affiliateId` | Get wallet balance + locked funds |

### Withdrawals
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/withdrawals` | List withdrawal requests |
| `POST` | `/withdrawals` | Request withdrawal (24h limit enforced) |

### Admin / System
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/admin/run-advance-payout-job` | Trigger advance payout batch |
| `GET` | `/admin/jobs` | View system job history |
| `GET` | `/reconciliation` | List reconciliation runs |
| `POST` | `/reconciliation` | Trigger manual reconciliation |
| `GET` | `/transactions` | Gateway transaction log |
| `GET` | `/dashboard/metrics` | Aggregated dashboard stats |
| `GET` | `/health` | Service health + DB status |

---

## Edge Cases & Failure Handling

### 1. Duplicate Advance Payout Prevention
**Scenario:** Batch job runs twice, or crashes mid-run and retries.

**Solution:** `@unique saleId` on `advance_payouts` table. Even if the application layer fails to check, the database **will reject** a second INSERT with a `P2002` unique constraint error. Zero duplicates — guaranteed at DB level.

```sql
-- This is impossible in our schema:
INSERT INTO advance_payouts (saleId, ...) VALUES ('sale-123', ...);
INSERT INTO advance_payouts (saleId, ...) VALUES ('sale-123', ...);  -- ❌ UNIQUE violation
```

### 2. Webhook Idempotency (Duplicate Sale Creation)
**Scenario:** Brand retries their webhook after a timeout.

**Solution:** `externalOrderId @unique` on `sales` table. Duplicate webhooks return `409 Conflict` — no double billing.

### 3. Concurrent Wallet Updates
**Scenario:** Two payouts credited simultaneously → balance corruption.

**Solution:** Optimistic locking via `version` field:
```sql
UPDATE wallets SET available_balance = $new, version = version + 1
WHERE id = $id AND version = $current_version
-- If 0 rows affected → concurrent write → retry
```

### 4. Withdrawal 24-Hour Cooldown
**Scenario:** Affiliate tries to withdraw twice in rapid succession.

**Solution:** Service checks `lastWithdrawalAt < NOW() - 24h` before processing.
```
Error: WithdrawalTooSoonError (HTTP 409 Conflict)
```

### 5. Insufficient Balance
**Scenario:** Affiliate requests withdrawal > available balance.

**Solution:** `InsufficientBalanceError` thrown before any DB mutation.
```
Error: InsufficientBalanceError (HTTP 422 Unprocessable Entity)
```

### 6. Failed Payout Recovery
**Scenario:** Withdrawal transfer fails after funds were locked.

**Solution:** `WITHDRAWAL_UNLOCK` ledger entry returns `lockedBalance → availableBalance`. Affiliate can withdraw again.

### 7. Reconciliation Discrepancy
**Scenario:** Bug causes wallet balance to drift from ledger truth.

**Solution:** Nightly reconciliation computes `SUM(ledger entries)` and auto-corrects with `ADJUSTMENT_CREDIT` or `ADJUSTMENT_DEBIT` entries. Every correction is audited.

---

## Key Design Decisions & Trade-offs

### Decision 1: Money as `Decimal`, Never Float
**Why:** Floating point arithmetic loses precision with money. `0.1 + 0.2 = 0.30000000000000004` in JavaScript.

**Implementation:** All monetary fields use `Decimal @db.Decimal(12,2)` (Postgres `NUMERIC`). Operations use Prisma's `Decimal` class.

**Trade-off:** Slightly more verbose code; zero risk of financial errors.

### Decision 2: Immutable WalletLedger
**Why:** Financial audit trail must be permanent. Every balance change is traceable.

**Implementation:** `WalletLedger` has no `updatedAt`. Entries are append-only. `availableBalance` is always re-computable from `SUM(ledger)`.

**Trade-off:** More storage; perfect auditability.

### Decision 3: Commission Snapshots in Sale
**Why:** If Brand changes commission rate later, old sales must not be retroactively affected.

**Implementation:** `commissionRate` and `advanceRate` are copied (snapshotted) into each `Sale` at creation time from the Brand's current rates.

**Trade-off:** Data duplication; data integrity across time.

### Decision 4: DB-Level Idempotency, not Application-Level
**Why:** Application checks like `if (advancePayout exists) return` are vulnerable to race conditions in concurrent systems.

**Implementation:** `@unique saleId` on `advance_payouts` is a hard DB constraint. Two concurrent batch jobs physically cannot create two advance payouts for the same sale.

**Trade-off:** Slightly less readable error messages; bulletproof correctness.

### Decision 5: Repository + Service Layering
**Why:** Keeps database access code separate from business rules. Services are testable with mocked repositories.

**Implementation:** `SaleRepository` handles DB queries; `PayoutService` handles business rules — they never mix.

---

## Running the Project

### Prerequisites
- Node.js 18+
- PostgreSQL database (Supabase, Neon, or local)

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/kumardhruv88/task.git
cd task

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env — add your DATABASE_URL and NEXTAUTH_SECRET

# 4. Push schema to database
npx prisma generate
npx prisma db push

# 5. Seed with demo data (50 sales, 1 affiliate, wallet)
npm run db:seed

# 6. Start the server
npm run dev
```

Open **http://localhost:8542**

### Running Tests

```bash
npm test              # Run all unit tests
npm run test:coverage # With coverage report
```

---

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── dashboard/metrics/  # Aggregated KPIs
│   │   ├── sales/              # Sales CRUD + approve/reject
│   │   ├── wallet/             # Wallet balance
│   │   ├── withdrawals/        # Withdrawal requests
│   │   ├── reconciliation/     # Reconciliation runs
│   │   ├── admin/              # Batch job triggers
│   │   ├── transactions/       # Gateway log
│   │   └── health/             # Health check
│   ├── sales/                  # Sales UI page
│   ├── wallet/                 # Wallet UI page
│   ├── withdrawals/            # Withdrawals UI page
│   ├── reconciliation/         # Reconciliation UI page
│   └── admin/                  # Admin controls UI page
│
├── services/                   # Business logic
│   ├── payout.service.ts       # Advance payout batch
│   ├── sale.service.ts         # Approve/reject state machine
│   ├── wallet.service.ts       # Atomic balance mutations
│   ├── withdrawal.service.ts   # Withdrawal lifecycle
│   ├── reconciliation.service.ts
│   └── audit.service.ts
│
├── repositories/               # Database access layer
├── hooks/                      # React data-fetching hooks (TanStack Query)
├── components/                 # UI components
├── lib/
│   ├── prisma.ts               # DB client singleton
│   ├── errors.ts               # Domain error classes
│   └── validators/             # Zod schemas for all APIs
└── prisma/
    └── schema.prisma           # Full database schema (16 models)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router + Turbopack) |
| Language | TypeScript |
| UI | React 19 + Tailwind CSS v4 |
| Data Fetching | TanStack Query v5 |
| ORM | Prisma v7 + @prisma/adapter-pg |
| Database | PostgreSQL (Supabase) |
| Validation | Zod |
| Testing | Vitest + vitest-mock-extended |
