import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { StaffPayrollService } from "../../application/services/staff-payroll.service";
import { RequirePermission } from "../../../../common/decorators/permissions.decorator";
import {
  createStaffSchema,
  updateStaffSchema,
  generateStaffContractSchema,
} from "@sgc/contracts";

@ApiTags("Staff & Payroll - Staff")
@ApiBearerAuth()
@Controller("v1/staff")
export class StaffController {
  constructor(private readonly service: StaffPayrollService) {}

  @Get()
  @RequirePermission("staff:staff.list")
  @ApiOperation({ summary: "List staff members by condominium" })
  async listStaff(@Query("condominiumId") condominiumId: string) {
    return this.service.listStaff(condominiumId);
  }

  @Get(":id")
  @RequirePermission("staff:staff.list")
  @ApiOperation({ summary: "Get staff member details" })
  async getStaff(@Param("id") id: string) {
    return this.service.getStaff(id);
  }

  @Post()
  @RequirePermission("staff:staff.create")
  @ApiOperation({ summary: "Register new staff worker" })
  async createStaff(@Body() body: any) {
    const validated = createStaffSchema.parse(body);
    return this.service.createStaff(validated);
  }

  @Patch(":id")
  @RequirePermission("staff:staff.update")
  @ApiOperation({ summary: "Update staff details" })
  async updateStaff(@Param("id") id: string, @Body() body: any) {
    const validated = updateStaffSchema.parse(body);
    return this.service.updateStaff(id, validated);
  }

  @Delete(":id")
  @RequirePermission("staff:staff.deactivate")
  @ApiOperation({ summary: "Deactivate staff member (soft delete)" })
  async deactivateStaff(@Param("id") id: string) {
    return this.service.deactivateStaff(id);
  }

  @Get(":id/contracts")
  @RequirePermission("staff:contract.list")
  @ApiOperation({ summary: "List employment contracts for staff member" })
  async listContracts(@Param("id") id: string) {
    return this.service.listStaffContracts(id);
  }

  @Post(":id/contracts/generate")
  @RequirePermission("staff:contract.generate")
  @ApiOperation({ summary: "Generate contract from template" })
  async generateContract(@Param("id") id: string, @Body() body: any) {
    const validated = generateStaffContractSchema.parse({ ...body, staffId: id });
    return this.service.generateContract(validated);
  }

  @Get(":id/attendance")
  @RequirePermission("staff:attendance.list")
  @ApiOperation({ summary: "List attendance history for staff member" })
  async listStaffAttendance(@Param("id") id: string) {
    return this.service.listStaffAttendance(id);
  }
}
