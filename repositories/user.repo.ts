import { PrismaClient, User, UserRole } from "@prisma/client";
import { prisma, TransactionClient } from "@/lib/prisma";

export class UserRepository {
  /**
   * Responsibility: Provides basic CRUD for User operators (Admins, Managers).
   */
  async findById(id: string, tx?: TransactionClient): Promise<User | null> {
    const client = tx || prisma;
    return client.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string, tx?: TransactionClient): Promise<User | null> {
    const client = tx || prisma;
    return client.user.findUnique({ where: { email } });
  }

  async findActiveByRole(role: UserRole, tx?: TransactionClient): Promise<User[]> {
    const client = tx || prisma;
    return client.user.findMany({ where: { role, isActive: true, deletedAt: null } });
  }
}
