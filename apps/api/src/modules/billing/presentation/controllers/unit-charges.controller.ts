import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { BillingService } from "../../application/services/billing.service";
import { RequirePermission } from "../../../../common/decorators/permissions.decorator";
import { generateUnitChargesSchema } from "@sgc/contracts";

@ApiTags("Billing - Unit Charges")
@ApiBearerAuth()
@Controller("v1/unit-charges")
export class UnitChargesController {
  constructor(private readonly billingService: BillingService) {}

  @Get()
  @RequirePermission("billing:charge.list")
  @ApiOperation({ summary: "List unit charges" })
  async listUnitCharges(
    @Query("condominiumId") condominiumId: string,
    @Query("period") period?: string,
    @Query("status") status?: string,
    @Query("unitId") unitId?: string
  ) {
    return this.billingService.listUnitCharges(condominiumId, { period, status, unitId });
  }

  @Post("generate")
  @RequirePermission("billing:charge.generate")
  @ApiOperation({ summary: "Generate monthly unit charges for all units" })
  @ApiResponse({ status: 201, description: "Monthly charges generated" })
  async generateMonthlyCharges(@Body() body: any) {
    const validated = generateUnitChargesSchema.parse(body);
    return this.billingService.generateMonthlyCharges(validated);
  }

  @Post("apply-mora")
  @RequirePermission("billing:charge.generate")
  @ApiOperation({ summary: "Trigger overdue check and mora calculation" })
  async applyMora(@Query("condominiumId") condominiumId: string) {
    await this.billingService.applyMora(condominiumId);
    return { success: true, message: "Mora recalculada exitosamente" };
  }
}
