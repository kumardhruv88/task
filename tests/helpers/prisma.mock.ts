import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';
import { vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';

// Mock the prisma module
vi.mock('@/lib/prisma', () => ({
  prisma: mockDeep<PrismaClient>(),
}));

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

beforeEach(() => {
  mockReset(prismaMock);
});
