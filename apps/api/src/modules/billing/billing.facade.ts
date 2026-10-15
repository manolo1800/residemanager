import { Injectable } from "@nestjs/common";
import { BillingService } from "./application/services/billing.service";
import { FeePlanRepository } from "./infrastructure/repositories/fee-plan.repository";
import { UnitChargeRepository } from "./infrastructure/repositories/unit-charge.repository";

@Injectable()
export class BillingFacade {
  constructor(
    private readonly billingService: BillingService,
    private readonly feePlanRepo: FeePlanRepository,
    private readonly unitChargeRepo: UnitChargeRepository
  ) {}

  async getUnitStatement(unitId: string) {
    return this.billingService.getUnitStatement(unitId);
  }

  async listUnitCharges(condominiumId: string, unitId?: string) {
    return this.billingService.listUnitCharges(condominiumId, { unitId });
  }
}
