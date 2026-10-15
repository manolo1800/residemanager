import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { StaffPayrollService } from "../../application/services/staff-payroll.service";
import { RequirePermission } from "../../../../common/decorators/permissions.decorator";
import {
  createAttendanceSchema,
  updateAttendanceSchema,
} from "@sgc/contracts";

@ApiTags("Staff & Payroll - Attendance")
@ApiBearerAuth()
@Controller("v1/staff-attendance")
export class StaffAttendanceController {
  constructor(private readonly service: StaffPayrollService) {}

  @Get()
  @RequirePermission("staff:attendance.list")
  @ApiOperation({ summary: "List staff attendance by condominium and date" })
  async listAttendance(
    @Query("condominiumId") condominiumId: string,
    @Query("date") date: string
  ) {
    return this.service.listAttendanceByDate(condominiumId, date);
  }

  @Post()
  @RequirePermission("staff:attendance.create")
  @ApiOperation({ summary: "Record daily attendance for staff member" })
  async recordAttendance(@Body() body: any) {
    const validated = createAttendanceSchema.parse(body);
    return this.service.recordAttendance(validated);
  }

  @Patch(":id")
  @RequirePermission("staff:attendance.update")
  @ApiOperation({ summary: "Update attendance record" })
  async updateAttendance(@Param("id") id: string, @Body() body: any) {
    const validated = updateAttendanceSchema.parse(body);
    return this.service.updateAttendance(id, validated);
  }
}
