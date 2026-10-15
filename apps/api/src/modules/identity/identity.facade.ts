import { Injectable } from "@nestjs/common";
import { UserRepository } from "./infrastructure/repositories/user.repository";
import { TenantRepository } from "./infrastructure/repositories/tenant.repository";

@Injectable()
export class IdentityFacade {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly tenantRepo: TenantRepository
  ) {}

  async getUserById(id: string) {
    return this.userRepo.findById(id);
  }

  async getTenantById(id: string) {
    return this.tenantRepo.findById(id);
  }
}
