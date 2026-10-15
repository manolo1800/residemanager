import { Injectable } from "@nestjs/common";
import { StaffPayrollService } from "./application/services/staff-payroll.service";

@Injectable()
export class StaffPayrollFacade {
  constructor(private readonly service: StaffPayrollService) {}

  async listStaff(condominiumId: string) {
    return this.service.listStaff(condominiumId);
  }

  async listPayrollPeriods(condominiumId: string) {
    return this.service.listPayrollPeriods(condominiumId);
  }

  async listAdvances(condominiumId: string) {
    return this.service.listAdvances(condominiumId);
  }
}
