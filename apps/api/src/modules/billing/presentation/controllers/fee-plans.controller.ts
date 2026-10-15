import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { BillingService } from "../../application/services/billing.service";
import { RequirePermission } from "../../../../common/decorators/permissions.decorator";
import { createFeePlanSchema, updateFeePlanSchema } from "@sgc/contracts";

@ApiTags("Billing - Fee Plans")
@ApiBearerAuth()
@Controller("v1/fee-plans")
export class FeePlansController {
  constructor(private readonly billingService: BillingService) {}

  @Get()
  @RequirePermission("billing:fee.list")
  @ApiOperation({ summary: "List fee plans for a condominium" })
  async listFeePlans(
    @Query("condominiumId") condominiumId: string,
    @Query("type") type?: string,
    @Query("status") status?: string
  ) {
    return this.billingService.listFeePlans(condominiumId, { type, status });
  }

  @Post()
  @RequirePermission("billing:fee.create")
  @ApiOperation({ summary: "Create fee plan (ordinary/extraordinary)" })
  @ApiResponse({ status: 201, description: "Fee plan created" })
  async createFeePlan(@Body() body: any) {
    const validated = createFeePlanSchema.parse(body);
    return this.billingService.createFeePlan(validated);
  }

  @Patch(":id")
  @RequirePermission("billing:fee.update")
  @ApiOperation({ summary: "Update fee plan" })
  async updateFeePlan(@Param("id") id: string, @Body() body: any) {
    const validated = updateFeePlanSchema.parse(body);
    return this.billingService.updateFeePlan(id, validated);
  }

  @Delete(":id")
  @RequirePermission("billing:fee.cancel")
  @ApiOperation({ summary: "Cancel fee plan" })
  async cancelFeePlan(@Param("id") id: string) {
    return this.billingService.cancelFeePlan(id);
  }
}
