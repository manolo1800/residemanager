import { Injectable } from "@nestjs/common";
import { CondominiumRepository } from "./infrastructure/repositories/condominium.repository";
import { UnitRepository } from "./infrastructure/repositories/unit.repository";
import { StructureRepository } from "./infrastructure/repositories/structure.repository";

@Injectable()
export class CondominiumsFacade {
  constructor(
    private readonly condoRepo: CondominiumRepository,
    private readonly unitRepo: UnitRepository,
    private readonly structureRepo: StructureRepository
  ) {}

  async getCondominiumById(id: string, tenantId: string) {
    return this.condoRepo.findById(id, tenantId);
  }

  async hasUserAccess(userId: string, condominiumId: string): Promise<boolean> {
    return this.condoRepo.hasUserAccess(userId, condominiumId);
  }

  async getUnitById(unitId: string, condominiumId: string, tenantId: string) {
    return this.unitRepo.findById(unitId, condominiumId, tenantId);
  }

  async getUnitByCode(code: string, condominiumId: string, tenantId: string) {
    return this.unitRepo.findByCode(code, condominiumId, tenantId);
  }

  async countUnitsByCondominium(condominiumId: string, tenantId: string) {
    return this.unitRepo.count(condominiumId, tenantId);
  }

  async getStructuresByCondominium(condominiumId: string, tenantId: string) {
    return this.structureRepo.findByCondo(condominiumId, tenantId);
  }
}
