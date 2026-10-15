import { Injectable } from "@nestjs/common";
import { ExpenseService } from "./application/services/expense.service";

@Injectable()
export class ExpensesFacade {
  constructor(private readonly expenseService: ExpenseService) {}

  async listCategories(condominiumId: string) {
    return this.expenseService.listCategories(condominiumId);
  }

  async listExpenses(condominiumId: string) {
    return this.expenseService.listExpenses(condominiumId);
  }

  async getCashFlowSummary(condominiumId: string, period?: string) {
    return this.expenseService.getCashFlowSummary(condominiumId, period);
  }
}
