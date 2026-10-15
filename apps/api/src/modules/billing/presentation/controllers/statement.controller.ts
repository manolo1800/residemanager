import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { BillingService } from "../../application/services/billing.service";
import { RequirePermission } from "../../../../common/decorators/permissions.decorator";

@ApiTags("Billing - Statement & Morosity")
@ApiBearerAuth()
@Controller("v1")
export class StatementController {
  constructor(private readonly billingService: BillingService) {}

  @Get("units/:id/statement")
  @RequirePermission("billing:statement.read")
  @ApiOperation({ summary: "Get statement of account for a unit" })
  async getUnitStatement(@Param("id") unitId: string) {
    return this.billingService.getUnitStatement(unitId);
  }

  @Get("billing/morosity")
  @RequirePermission("billing:morosity.read")
  @ApiOperation({ summary: "Get morosity panel data for a condominium" })
  async getMorosityPanel(
    @Query("condominiumId") condominiumId: string,
    @Query("structureId") structureId?: string
  ) {
    return this.billingService.getMorosityPanel(condominiumId, structureId);
  }
}
