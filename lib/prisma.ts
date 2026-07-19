import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

/**
 * Prisma v7 requires an adapter for the new Wasm-based "client" engine.
 * We use @prisma/adapter-pg backed by a connection pool.
 *
 * Connection pooling strategy:
 *  - max 10 connections in development (generous)
 *  - The pool is created once at module load time and reused via globalThis singleton
 */
const connectionString = process.env.DATABASE_URL!;

const prismaClientSingleton = () => {
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Type utility to accept either the main Prisma client or a Transaction client.
 * Essential for repositories that need to participate in higher-level transactions.
 */
export type TransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;
