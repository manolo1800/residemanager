import { Module } from "@nestjs/common";
import { StaffPayrollFacade } from "./staff-payroll.facade";
import { StaffPayrollService } from "./application/services/staff-payroll.service";
import { StaffRepository } from "./infrastructure/repositories/staff.repository";
import { ContractTemplateRepository } from "./infrastructure/repositories/contract-template.repository";
import { StaffContractRepository } from "./infrastructure/repositories/staff-contract.repository";
import { StaffAttendanceRepository } from "./infrastructure/repositories/staff-attendance.repository";
import { PayrollPeriodRepository } from "./infrastructure/repositories/payroll-period.repository";
import { PayrollItemRepository } from "./infrastructure/repositories/payroll-item.repository";
import { StaffAdvanceRepository } from "./infrastructure/repositories/staff-advance.repository";
import { StaffController } from "./presentation/controllers/staff.controller";
import { ContractTemplatesController } from "./presentation/controllers/contract-templates.controller";
import { StaffAttendanceController } from "./presentation/controllers/staff-attendance.controller";
import { PayrollPeriodsController } from "./presentation/controllers/payroll-periods.controller";
import { PayrollItemsController } from "./presentation/controllers/payroll-items.controller";
import { StaffAdvancesController } from "./presentation/controllers/staff-advances.controller";
import { CondominiumsModule } from "../condominiums/condominiums.module";

@Module({
  imports: [CondominiumsModule],
  controllers: [
    StaffController,
    ContractTemplatesController,
    StaffAttendanceController,
    PayrollPeriodsController,
    PayrollItemsController,
    StaffAdvancesController,
  ],
  providers: [
    StaffPayrollFacade,
    StaffPayrollService,
    StaffRepository,
    ContractTemplateRepository,
    StaffContractRepository,
    StaffAttendanceRepository,
    PayrollPeriodRepository,
    PayrollItemRepository,
    StaffAdvanceRepository,
  ],
  exports: [
    StaffPayrollFacade,
    StaffPayrollService,
    StaffRepository,
    ContractTemplateRepository,
    StaffContractRepository,
    StaffAttendanceRepository,
    PayrollPeriodRepository,
    PayrollItemRepository,
    StaffAdvanceRepository,
  ],
})
export class StaffPayrollModule {}
