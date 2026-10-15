import { Module } from "@nestjs/common";
import { PaymentsFacade } from "./payments.facade";
import { PaymentService } from "./application/services/payment.service";
import { PaymentRepository } from "./infrastructure/repositories/payment.repository";
import { PaymentMethodRepository } from "./infrastructure/repositories/payment-method.repository";
import { PaymentMethodsController } from "./presentation/controllers/payment-methods.controller";
import {
  PaymentsController,
  ResidentPaymentsController,
} from "./presentation/controllers/payments.controller";
import { CondominiumsModule } from "../condominiums/condominiums.module";
import { PropertiesModule } from "../properties/properties.module";
import { BillingModule } from "../billing/billing.module";

@Module({
  imports: [CondominiumsModule, PropertiesModule, BillingModule],
  controllers: [
    PaymentMethodsController,
    PaymentsController,
    ResidentPaymentsController,
  ],
  providers: [
    PaymentsFacade,
    PaymentService,
    PaymentRepository,
    PaymentMethodRepository,
  ],
  exports: [PaymentsFacade, PaymentService, PaymentRepository, PaymentMethodRepository],
})
export class PaymentsModule {}
