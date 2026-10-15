import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { BillingService } from "../../application/services/billing.service";
import { RequirePermission } from "../../../../common/decorators/permissions.decorator";
import { createCurrencyRateSchema } from "@sgc/contracts";

@ApiTags("Billing - Currency Rates")
@ApiBearerAuth()
@Controller("v1/currency-rates")
export class CurrencyRatesController {
  constructor(private readonly billingService: BillingService) {}

  @Get()
  @RequirePermission("billing:rate.list")
  @ApiOperation({ summary: "List currency rates for a condominium" })
  async listCurrencyRates(@Query("condominiumId") condominiumId: string) {
    return this.billingService.listCurrencyRates(condominiumId);
  }

  @Post()
  @RequirePermission("billing:rate.create")
  @ApiOperation({ summary: "Register exchange rate" })
  @ApiResponse({ status: 201, description: "Currency rate registered" })
  async createCurrencyRate(@Body() body: any) {
    const validated = createCurrencyRateSchema.parse(body);
    return this.billingService.createCurrencyRate(validated);
  }
}
