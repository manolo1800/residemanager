import { Injectable } from "@nestjs/common";
import { PaymentService } from "./application/services/payment.service";

@Injectable()
export class PaymentsFacade {
  constructor(private readonly paymentService: PaymentService) {}

  async listPayments(condominiumId: string) {
    return this.paymentService.listPayments(condominiumId);
  }

  async getPaymentById(id: string) {
    return this.paymentService.getPaymentById(id);
  }
}
