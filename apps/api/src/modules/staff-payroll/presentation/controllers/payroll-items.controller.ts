import { Controller, Get, Param } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { StaffPayrollService } from "../../application/services/staff-payroll.service";
import { RequirePermission } from "../../../../common/decorators/permissions.decorator";

@ApiTags("Staff & Payroll - Payroll Items")
@ApiBearerAuth()
@Controller("v1/payroll-items")
export class PayrollItemsController {
  constructor(private readonly service: StaffPayrollService) {}

  @Get(":id")
  @RequirePermission("payroll:item.list")
  @ApiOperation({ summary: "Get payroll item detail" })
  async getItem(@Param("id") id: string) {
    return this.service.getPayrollItem(id);
  }

  @Get(":id/receipt")
  @RequirePermission("payroll:receipt.download")
  @ApiOperation({ summary: "Get payroll receipt PDF data" })
  async getReceipt(@Param("id") id: string) {
    const item = await this.service.getPayrollItem(id);
    return {
      receiptPdfUrl: item.receiptPdfUrl,
      item,
    };
  }
}
