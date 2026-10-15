import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { BillingService } from "../../application/services/billing.service";
import { RequirePermission } from "../../../../common/decorators/permissions.decorator";
import { createMoraRuleSchema } from "@sgc/contracts";

@ApiTags("Billing - Mora Rules")
@ApiBearerAuth()
@Controller("v1/mora-rules")
export class MoraRulesController {
  constructor(private readonly billingService: BillingService) {}

  @Get()
  @RequirePermission("billing:mora.list")
  @ApiOperation({ summary: "List mora rules for a condominium" })
  async listMoraRules(@Query("condominiumId") condominiumId: string) {
    return this.billingService.listMoraRules(condominiumId);
  }

  @Post()
  @RequirePermission("billing:mora.create")
  @ApiOperation({ summary: "Create mora rule" })
  @ApiResponse({ status: 201, description: "Mora rule created" })
  async createMoraRule(@Body() body: any) {
    const validated = createMoraRuleSchema.parse(body);
    return this.billingService.createMoraRule(validated);
  }
}
