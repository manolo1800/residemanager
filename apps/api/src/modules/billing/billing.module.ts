import { Module } from "@nestjs/common";
import { BillingFacade } from "./billing.facade";
import { BillingService } from "./application/services/billing.service";
import { FeePlanRepository } from "./infrastructure/repositories/fee-plan.repository";
import { UnitChargeRepository } from "./infrastructure/repositories/unit-charge.repository";
import { MoraRuleRepository } from "./infrastructure/repositories/mora-rule.repository";
import { CurrencyRateRepository } from "./infrastructure/repositories/currency-rate.repository";
import { FeePlansController } from "./presentation/controllers/fee-plans.controller";
import { UnitChargesController } from "./presentation/controllers/unit-charges.controller";
import { StatementController } from "./presentation/controllers/statement.controller";
import { MoraRulesController } from "./presentation/controllers/mora-rules.controller";
import { CurrencyRatesController } from "./presentation/controllers/currency-rates.controller";
import { CondominiumsModule } from "../condominiums/condominiums.module";
import { PropertiesModule } from "../properties/properties.module";

@Module({
  imports: [CondominiumsModule, PropertiesModule],
  controllers: [
    FeePlansController,
    UnitChargesController,
    StatementController,
    MoraRulesController,
    CurrencyRatesController,
  ],
  providers: [
    BillingFacade,
    BillingService,
    FeePlanRepository,
    UnitChargeRepository,
    MoraRuleRepository,
    CurrencyRateRepository,
  ],
  exports: [BillingFacade, BillingService, UnitChargeRepository],
})
export class BillingModule {}
