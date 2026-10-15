import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { StaffPayrollService } from "../../application/services/staff-payroll.service";
import { RequirePermission } from "../../../../common/decorators/permissions.decorator";
import {
  createStaffAdvanceSchema,
  approveStaffAdvanceSchema,
} from "@sgc/contracts";

@ApiTags("Staff & Payroll - Advances")
@ApiBearerAuth()
@Controller("v1/staff-advances")
export class StaffAdvancesController {
  constructor(private readonly service: StaffPayrollService) {}

  @Get()
  @RequirePermission("staff:advance.list")
  @ApiOperation({ summary: "List staff salary advances by condominium" })
  async listAdvances(@Query("condominiumId") condominiumId: string) {
    return this.service.listAdvances(condominiumId);
  }

  @Post()
  @RequirePermission("staff:advance.create")
  @ApiOperation({ summary: "Request staff advance with installment scheduling" })
  async createAdvance(@Body() body: any) {
    const validated = createStaffAdvanceSchema.parse(body);
    return this.service.createAdvance(validated);
  }

  @Patch(":id/approve")
  @RequirePermission("staff:advance.approve")
  @ApiOperation({ summary: "Approve or reject staff advance" })
  async approveAdvance(@Param("id") id: string, @Body() body: any) {
    const validated = approveStaffAdvanceSchema.parse(body);
    return this.service.approveAdvance(id, validated);
  }
}
