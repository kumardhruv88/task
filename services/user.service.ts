import { UserRole } from "@prisma/client";
import { UserRepository } from "@/repositories/user.repo";
import { EntityNotFoundError } from "@/lib/errors";

export class UserService {
  constructor(private userRepo: UserRepository) {}

  async getUserById(id: string) {
    const user = await this.userRepo.findById(id);
    if (!user) throw new EntityNotFoundError("User", id);
    return user;
  }

  async getActiveOperators(role: UserRole) {
    return this.userRepo.findActiveByRole(role);
  }
}

export const userService = new UserService(new UserRepository());
