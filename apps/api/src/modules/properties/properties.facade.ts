import { Injectable } from "@nestjs/common";
import { PersonRepository } from "./infrastructure/repositories/person.repository";
import { UnitOwnershipRepository } from "./infrastructure/repositories/unit-ownership.repository";

@Injectable()
export class PropertiesFacade {
  constructor(
    private readonly personRepo: PersonRepository,
    private readonly ownershipRepo: UnitOwnershipRepository
  ) {}

  async getPersonById(id: string, tenantId: string) {
    return this.personRepo.findById(id, tenantId);
  }

  async getActiveOwnerForUnit(unitId: string, tenantId: string) {
    return this.ownershipRepo.findActiveForUnit(unitId, tenantId);
  }

  async listUserProperties(userId: string, tenantId: string) {
    return this.ownershipRepo.listForUser(userId, tenantId);
  }
}
