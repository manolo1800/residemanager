import { Module } from "@nestjs/common";
import { ExpensesFacade } from "./expenses.facade";
import { ExpenseService } from "./application/services/expense.service";
import { ExpenseCategoryRepository } from "./infrastructure/repositories/expense-category.repository";
import { ExpenseRepository } from "./infrastructure/repositories/expense.repository";
import { BudgetRepository } from "./infrastructure/repositories/budget.repository";
import { SupplierRepository } from "./infrastructure/repositories/supplier.repository";
import { SupplierInvoiceRepository } from "./infrastructure/repositories/supplier-invoice.repository";
import { SupplierPaymentRepository } from "./infrastructure/repositories/supplier-payment.repository";
import { ExpenseCategoriesController } from "./presentation/controllers/expense-categories.controller";
import { ExpensesController } from "./presentation/controllers/expenses.controller";
import { BudgetsController } from "./presentation/controllers/budgets.controller";
import { SuppliersController } from "./presentation/controllers/suppliers.controller";
import { SupplierInvoicesController } from "./presentation/controllers/supplier-invoices.controller";
import { CashflowController } from "./presentation/controllers/cashflow.controller";
import { CondominiumsModule } from "../condominiums/condominiums.module";

@Module({
  imports: [CondominiumsModule],
  controllers: [
    ExpenseCategoriesController,
    ExpensesController,
    BudgetsController,
    SuppliersController,
    SupplierInvoicesController,
    CashflowController,
  ],
  providers: [
    ExpensesFacade,
    ExpenseService,
    ExpenseCategoryRepository,
    ExpenseRepository,
    BudgetRepository,
    SupplierRepository,
    SupplierInvoiceRepository,
    SupplierPaymentRepository,
  ],
  exports: [
    ExpensesFacade,
    ExpenseService,
    ExpenseCategoryRepository,
    ExpenseRepository,
    BudgetRepository,
    SupplierRepository,
    SupplierInvoiceRepository,
    SupplierPaymentRepository,
  ],
})
export class ExpensesModule {}
