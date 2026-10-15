import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { StaffPayrollService } from "../../application/services/staff-payroll.service";
import { RequirePermission } from "../../../../common/decorators/permissions.decorator";
import { createPayrollPeriodSchema } from "@sgc/contracts";

@ApiTags("Staff & Payroll - Payroll Periods")
@ApiBearerAuth()
@Controller("v1/payroll-periods")
export class PayrollPeriodsController {
  constructor(private readonly service: StaffPayrollService) {}

  @Get()
  @RequirePermission("payroll:period.list")
  @ApiOperation({ summary: "List payroll periods by condominium" })
  async listPeriods(@Query("condominiumId") condominiumId: string) {
    return this.service.listPayrollPeriods(condominiumId);
  }

  @Get(":id")
  @RequirePermission("payroll:period.list")
  @ApiOperation({ summary: "Get payroll period by ID" })
  async getPeriod(@Param("id") id: string) {
    return this.service.getPayrollPeriod(id);
  }

  @Post()
  @RequirePermission("payroll:period.create")
  @ApiOperation({ summary: "Create payroll period and auto-calculate worker items" })
  async createPeriod(@Body() body: any) {
    const validated = createPayrollPeriodSchema.parse(body);
    return this.service.createPayrollPeriod(validated);
  }

  @Post(":id/close")
  @RequirePermission("payroll:period.close")
  @ApiOperation({ summary: "Close payroll period and commit advance deductions" })
  async closePeriod(@Param("id") id: string) {
    return this.service.closePayrollPeriod(id);
  }

  @Post(":id/pay")
  @RequirePermission("payroll:period.pay")
  @ApiOperation({ summary: "Mark payroll period as fully paid" })
  async payPeriod(@Param("id") id: string) {
    return this.service.payPayrollPeriod(id);
  }

  @Get(":id/items")
  @RequirePermission("payroll:item.list")
  @ApiOperation({ summary: "List individual items for a payroll period" })
  async listPeriodItems(@Param("id") id: string) {
    return this.service.listPayrollItems(id);
  }
}
