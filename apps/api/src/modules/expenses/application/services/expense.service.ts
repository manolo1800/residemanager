import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ExpenseCategoryRepository } from "../../infrastructure/repositories/expense-category.repository";
import { ExpenseRepository } from "../../infrastructure/repositories/expense.repository";
import { BudgetRepository } from "../../infrastructure/repositories/budget.repository";
import { SupplierRepository } from "../../infrastructure/repositories/supplier.repository";
import { SupplierInvoiceRepository } from "../../infrastructure/repositories/supplier-invoice.repository";
import { SupplierPaymentRepository } from "../../infrastructure/repositories/supplier-payment.repository";
import { CondominiumsFacade } from "../../../condominiums/condominiums.facade";
import { RequestContextStore } from "../../../../common/context/request-context";
import { DatabaseService } from "../../../../common/database/database.service";
import { payments, unitCharges } from "@sgc/database";
import { and, eq, isNull, gte, lte } from "drizzle-orm";
import {
  CreateExpenseCategoryRequest,
  UpdateExpenseCategoryRequest,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  ExpenseFilterQuery,
  CreateBudgetRequest,
  UpdateBudgetRequest,
  CreateSupplierRequest,
  UpdateSupplierRequest,
  CreateSupplierInvoiceRequest,
  CreateSupplierPaymentRequest,
} from "@sgc/contracts";

@Injectable()
export class ExpenseService {
  constructor(
    private readonly categoryRepo: ExpenseCategoryRepository,
    private readonly expenseRepo: ExpenseRepository,
    private readonly budgetRepo: BudgetRepository,
    private readonly supplierRepo: SupplierRepository,
    private readonly supplierInvoiceRepo: SupplierInvoiceRepository,
    private readonly supplierPaymentRepo: SupplierPaymentRepository,
    private readonly condoFacade: CondominiumsFacade,
    private readonly dbService: DatabaseService
  ) {}

  // ==========================================
  // 1. CATEGORÍAS DE GASTO
  // ==========================================
  async listCategories(condominiumId: string) {
    const ctx = RequestContextStore.getOrThrow();
    return this.categoryRepo.listByCondominium(condominiumId, ctx.tenantId);
  }

  async createCategory(dto: CreateExpenseCategoryRequest) {
    const ctx = RequestContextStore.getOrThrow();
    const condo = await this.condoFacade.getCondominiumById(dto.condominiumId, ctx.tenantId);
    if (!condo) throw new NotFoundException("Condominio no encontrado");

    return this.categoryRepo.create({
      tenantId: ctx.tenantId,
      condominiumId: dto.condominiumId,
      name: dto.name,
      description: dto.description || null,
      color: dto.color || "blue",
      isSystem: dto.isSystem ?? false,
    });
  }

  async updateCategory(id: string, dto: UpdateExpenseCategoryRequest) {
    const ctx = RequestContextStore.getOrThrow();
    const existing = await this.categoryRepo.findById(id, ctx.tenantId);
    if (!existing) throw new NotFoundException("Categoría no encontrada");

    return this.categoryRepo.update(id, ctx.tenantId, {
      ...(dto.name && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.color !== undefined && { color: dto.color }),
    });
  }

  async deleteCategory(id: string) {
    const ctx = RequestContextStore.getOrThrow();
    const existing = await this.categoryRepo.findById(id, ctx.tenantId);
    if (!existing) throw new NotFoundException("Categoría no encontrada");
    if (existing.isSystem) {
      throw new BadRequestException("No se puede eliminar una categoría base del sistema");
    }

    return this.categoryRepo.softDelete(id, ctx.tenantId);
  }

  // ==========================================
  // 2. GASTOS OPERATIVOS DIRECTOS
  // ==========================================
  async listExpenses(condominiumId: string, filters?: Partial<ExpenseFilterQuery>) {
    const ctx = RequestContextStore.getOrThrow();
    return this.expenseRepo.list(condominiumId, ctx.tenantId, {
      categoryId: filters?.categoryId,
      supplierId: filters?.supplierId,
      status: filters?.status,
      isBankCommission: filters?.isBankCommission,
      fromDate: filters?.fromDate,
      toDate: filters?.toDate,
    });
  }

  async getExpenseById(id: string) {
    const ctx = RequestContextStore.getOrThrow();
    const expense = await this.expenseRepo.findById(id, ctx.tenantId);
    if (!expense) throw new NotFoundException("Gasto no encontrado");
    return expense;
  }

  async createExpense(dto: CreateExpenseRequest) {
    const ctx = RequestContextStore.getOrThrow();
    const condo = await this.condoFacade.getCondominiumById(dto.condominiumId, ctx.tenantId);
    if (!condo) throw new NotFoundException("Condominio no encontrado");

    const category = await this.categoryRepo.findById(dto.categoryId, ctx.tenantId);
    if (!category) throw new NotFoundException("Categoría de gasto no encontrada");

    let exchangeRate = dto.exchangeRate ? String(dto.exchangeRate) : null;
    let amountBase = dto.amountBaseCurrency ? String(dto.amountBaseCurrency) : dto.amount;

    return this.expenseRepo.create({
      tenantId: ctx.tenantId,
      condominiumId: dto.condominiumId,
      categoryId: dto.categoryId,
      supplierId: dto.supplierId || null,
      concept: dto.concept,
      description: dto.description || null,
      amount: String(dto.amount),
      currency: dto.currency || "USD",
      exchangeRate,
      amountBaseCurrency: amountBase,
      expenseDate: dto.expenseDate,
      receiptUrl: dto.receiptUrl || null,
      status: dto.status || "paid",
      isBankCommission: dto.isBankCommission ?? false,
      sourceBankMovementId: dto.sourceBankMovementId || null,
      paymentMethod: dto.paymentMethod || null,
      referenceNumber: dto.referenceNumber || null,
      createdBy: ctx.userId || null,
    });
  }

  async updateExpense(id: string, dto: UpdateExpenseRequest) {
    const ctx = RequestContextStore.getOrThrow();
    const existing = await this.expenseRepo.findById(id, ctx.tenantId);
    if (!existing) throw new NotFoundException("Gasto no encontrado");

    return this.expenseRepo.update(id, ctx.tenantId, {
      ...(dto.categoryId && { categoryId: dto.categoryId }),
      ...(dto.supplierId !== undefined && { supplierId: dto.supplierId }),
      ...(dto.concept && { concept: dto.concept }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.amount && { amount: String(dto.amount) }),
      ...(dto.currency && { currency: dto.currency }),
      ...(dto.exchangeRate !== undefined && { exchangeRate: dto.exchangeRate ? String(dto.exchangeRate) : null }),
      ...(dto.amountBaseCurrency !== undefined && { amountBaseCurrency: dto.amountBaseCurrency ? String(dto.amountBaseCurrency) : null }),
      ...(dto.expenseDate && { expenseDate: dto.expenseDate }),
      ...(dto.receiptUrl !== undefined && { receiptUrl: dto.receiptUrl }),
      ...(dto.status && { status: dto.status }),
      ...(dto.paymentMethod !== undefined && { paymentMethod: dto.paymentMethod }),
      ...(dto.referenceNumber !== undefined && { referenceNumber: dto.referenceNumber }),
      updatedBy: ctx.userId || null,
    });
  }

  async cancelExpense(id: string) {
    const ctx = RequestContextStore.getOrThrow();
    const existing = await this.expenseRepo.findById(id, ctx.tenantId);
    if (!existing) throw new NotFoundException("Gasto no encontrado");

    return this.expenseRepo.softDelete(id, ctx.tenantId);
  }

  // ==========================================
  // 3. PRESUPUESTOS Y ALERTAS (BR-039)
  // ==========================================
  async listBudgets(condominiumId: string, period?: string) {
    const ctx = RequestContextStore.getOrThrow();
    return this.budgetRepo.listByCondominium(condominiumId, ctx.tenantId, period);
  }

  async createBudget(dto: CreateBudgetRequest) {
    const ctx = RequestContextStore.getOrThrow();
    const condo = await this.condoFacade.getCondominiumById(dto.condominiumId, ctx.tenantId);
    if (!condo) throw new NotFoundException("Condominio no encontrado");

    const category = await this.categoryRepo.findById(dto.categoryId, ctx.tenantId);
    if (!category) throw new NotFoundException("Categoría no encontrada");

    const existing = await this.budgetRepo.findByPeriodAndCategory(
      dto.condominiumId,
      dto.categoryId,
      dto.period,
      ctx.tenantId
    );
    if (existing) {
      throw new ConflictException(`Ya existe un presupuesto asignado para esa categoría en el período ${dto.period}`);
    }

    return this.budgetRepo.create({
      tenantId: ctx.tenantId,
      condominiumId: dto.condominiumId,
      categoryId: dto.categoryId,
      period: dto.period,
      amount: String(dto.amount),
      currency: dto.currency || "USD",
      alertThresholdPct: String(dto.alertThresholdPct || "80.00"),
      notes: dto.notes || null,
    });
  }

  async updateBudget(id: string, dto: UpdateBudgetRequest) {
    const ctx = RequestContextStore.getOrThrow();
    const existing = await this.budgetRepo.findById(id, ctx.tenantId);
    if (!existing) throw new NotFoundException("Presupuesto no encontrado");

    return this.budgetRepo.update(id, ctx.tenantId, {
      ...(dto.amount && { amount: String(dto.amount) }),
      ...(dto.currency && { currency: dto.currency }),
      ...(dto.alertThresholdPct && { alertThresholdPct: String(dto.alertThresholdPct) }),
      ...(dto.notes !== undefined && { notes: dto.notes }),
    });
  }

  async getBudgetsSummary(condominiumId: string, period: string) {
    const ctx = RequestContextStore.getOrThrow();
    const budgetsList = await this.budgetRepo.listByCondominium(condominiumId, ctx.tenantId, period);

    // Get date range for period (e.g. 2026-10 -> 2026-10-01 to 2026-10-31)
    const fromDate = `${period}-01`;
    const toDate = `${period}-31`;

    const expensesList = await this.expenseRepo.list(condominiumId, ctx.tenantId, {
      fromDate,
      toDate,
      status: "paid",
    });

    // Map expenses by category
    const spentByCategory = new Map<string, number>();
    for (const exp of expensesList) {
      const current = spentByCategory.get(exp.categoryId) || 0;
      spentByCategory.set(exp.categoryId, current + parseFloat(exp.amount || "0"));
    }

    const items = budgetsList.map((b) => {
      const budgetAmount = parseFloat(b.amount || "0");
      const spentAmount = spentByCategory.get(b.categoryId) || 0;
      const remainingAmount = Math.max(0, budgetAmount - spentAmount);
      const thresholdPct = parseFloat(b.alertThresholdPct || "80");
      const spentPercentage = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;

      let alertStatus: "normal" | "warning" | "danger" = "normal";
      if (spentPercentage >= 100) {
        alertStatus = "danger";
      } else if (spentPercentage >= thresholdPct) {
        alertStatus = "warning";
      }

      return {
        ...b,
        budgetAmount,
        spentAmount,
        remainingAmount,
        spentPercentage: Math.round(spentPercentage * 10) / 10,
        alertThresholdPct: thresholdPct,
        alertStatus,
        isThresholdExceeded: spentPercentage >= thresholdPct,
        isOverBudget: spentPercentage >= 100,
      };
    });

    const totalBudgeted = items.reduce((sum, item) => sum + item.budgetAmount, 0);
    const totalSpent = items.reduce((sum, item) => sum + item.spentAmount, 0);
    const totalRemaining = Math.max(0, totalBudgeted - totalSpent);
    const globalPercentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

    return {
      period,
      totalBudgeted,
      totalSpent,
      totalRemaining,
      globalPercentage: Math.round(globalPercentage * 10) / 10,
      items,
    };
  }

  // ==========================================
  // 4. PROVEEDORES
  // ==========================================
  async listSuppliers(condominiumId: string, search?: string) {
    const ctx = RequestContextStore.getOrThrow();
    return this.supplierRepo.listByCondominium(condominiumId, ctx.tenantId, search);
  }

  async getSupplierById(id: string) {
    const ctx = RequestContextStore.getOrThrow();
    const supplier = await this.supplierRepo.findById(id, ctx.tenantId);
    if (!supplier) throw new NotFoundException("Proveedor no encontrado");
    return supplier;
  }

  async createSupplier(dto: CreateSupplierRequest) {
    const ctx = RequestContextStore.getOrThrow();
    const condo = await this.condoFacade.getCondominiumById(dto.condominiumId, ctx.tenantId);
    if (!condo) throw new NotFoundException("Condominio no encontrado");

    return this.supplierRepo.create({
      tenantId: ctx.tenantId,
      condominiumId: dto.condominiumId,
      name: dto.name,
      taxId: dto.taxId || null,
      contact: dto.contact || null,
      email: dto.email || null,
      phone: dto.phone || null,
      address: dto.address || null,
      creditDays: dto.creditDays ?? 0,
      category: dto.category || null,
      notes: dto.notes || null,
    });
  }

  async updateSupplier(id: string, dto: UpdateSupplierRequest) {
    const ctx = RequestContextStore.getOrThrow();
    const existing = await this.supplierRepo.findById(id, ctx.tenantId);
    if (!existing) throw new NotFoundException("Proveedor no encontrado");

    return this.supplierRepo.update(id, ctx.tenantId, {
      ...(dto.name && { name: dto.name }),
      ...(dto.taxId !== undefined && { taxId: dto.taxId }),
      ...(dto.contact !== undefined && { contact: dto.contact }),
      ...(dto.email !== undefined && { email: dto.email }),
      ...(dto.phone !== undefined && { phone: dto.phone }),
      ...(dto.address !== undefined && { address: dto.address }),
      ...(dto.creditDays !== undefined && { creditDays: dto.creditDays }),
      ...(dto.category !== undefined && { category: dto.category }),
      ...(dto.notes !== undefined && { notes: dto.notes }),
    });
  }

  // ==========================================
  // 5. FACTURAS DE PROVEEDORES & CUENTAS POR PAGAR (BR-040)
  // ==========================================
  async listSupplierInvoices(condominiumId: string, filters?: { supplierId?: string; status?: string }) {
    const ctx = RequestContextStore.getOrThrow();
    const invoices = await this.supplierInvoiceRepo.list(condominiumId, ctx.tenantId, filters);

    const todayStr = new Date().toISOString().split("T")[0];

    // Check overdue dynamically
    return invoices.map((inv) => {
      const isOverdue =
        inv.status !== "paid" &&
        inv.dueDate &&
        inv.dueDate < todayStr;

      const totalAmount = parseFloat(inv.amount || "0");
      const paidAmount = parseFloat(inv.paidAmount || "0");
      const pendingAmount = Math.max(0, totalAmount - paidAmount);

      return {
        ...inv,
        status: isOverdue ? "overdue" : inv.status,
        pendingAmount: pendingAmount.toFixed(2),
        isOverdue,
      };
    });
  }

  async createSupplierInvoice(dto: CreateSupplierInvoiceRequest) {
    const ctx = RequestContextStore.getOrThrow();
    const condo = await this.condoFacade.getCondominiumById(dto.condominiumId, ctx.tenantId);
    if (!condo) throw new NotFoundException("Condominio no encontrado");

    const supplier = await this.supplierRepo.findById(dto.supplierId, ctx.tenantId);
    if (!supplier) throw new NotFoundException("Proveedor no encontrado");

    // Compute due date from supplier creditDays if not provided
    let calculatedDueDate = dto.dueDate;
    if (!calculatedDueDate && supplier.creditDays > 0) {
      const issueD = new Date(dto.issueDate);
      issueD.setDate(issueD.getDate() + supplier.creditDays);
      calculatedDueDate = issueD.toISOString().split("T")[0];
    } else if (!calculatedDueDate) {
      calculatedDueDate = dto.issueDate;
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const initialStatus = calculatedDueDate < todayStr ? "overdue" : "pending";

    return this.supplierInvoiceRepo.create({
      tenantId: ctx.tenantId,
      condominiumId: dto.condominiumId,
      supplierId: dto.supplierId,
      categoryId: dto.categoryId || null,
      invoiceNumber: dto.invoiceNumber,
      amount: String(dto.amount),
      paidAmount: "0.00",
      currency: dto.currency || "USD",
      issueDate: dto.issueDate,
      dueDate: calculatedDueDate,
      status: initialStatus,
      notes: dto.notes || null,
      receiptUrl: dto.receiptUrl || null,
    });
  }

  async paySupplierInvoice(dto: CreateSupplierPaymentRequest) {
    const ctx = RequestContextStore.getOrThrow();
    const invoice = await this.supplierInvoiceRepo.findById(dto.supplierInvoiceId, ctx.tenantId);
    if (!invoice) throw new NotFoundException("Factura de proveedor no encontrada");

    const payAmountNum = parseFloat(String(dto.amount));
    if (isNaN(payAmountNum) || payAmountNum <= 0) {
      throw new BadRequestException("El monto a pagar debe ser mayor a cero");
    }

    const totalAmount = parseFloat(invoice.amount || "0");
    const currentPaid = parseFloat(invoice.paidAmount || "0");
    const pendingBalance = totalAmount - currentPaid;

    if (payAmountNum > pendingBalance + 0.001) {
      throw new BadRequestException(
        `El monto a pagar (${payAmountNum}) supera el saldo pendiente de la factura (${pendingBalance.toFixed(2)})`
      );
    }

    // 1. Record supplier payment
    const payment = await this.supplierPaymentRepo.create({
      tenantId: ctx.tenantId,
      condominiumId: dto.condominiumId,
      supplierInvoiceId: dto.supplierInvoiceId,
      amount: String(dto.amount),
      currency: dto.currency || "USD",
      paymentDate: dto.paymentDate,
      method: dto.method || "transfer",
      reference: dto.reference || null,
      receiptUrl: dto.receiptUrl || null,
      notes: dto.notes || null,
      createdBy: ctx.userId || null,
    });

    // 2. Update invoice paid amount and status
    await this.supplierInvoiceRepo.recordPayment(dto.supplierInvoiceId, ctx.tenantId, payAmountNum);

    // 3. Register corresponding expense entry so cash flow and category metrics stay synchronized
    if (invoice.categoryId) {
      await this.expenseRepo.create({
        tenantId: ctx.tenantId,
        condominiumId: dto.condominiumId,
        categoryId: invoice.categoryId,
        supplierId: invoice.supplierId,
        concept: `Pago Factura ${invoice.invoiceNumber} - ${invoice.supplierName}`,
        description: dto.notes || `Abono de factura con método ${dto.method}`,
        amount: String(dto.amount),
        currency: dto.currency || "USD",
        expenseDate: dto.paymentDate,
        status: "paid",
        paymentMethod: dto.method || "transfer",
        referenceNumber: dto.reference || null,
        receiptUrl: dto.receiptUrl || invoice.receiptUrl || null,
        createdBy: ctx.userId || null,
      });
    }

    return payment;
  }

  // ==========================================
  // 6. FLUJO DE CAJA: INGRESOS VS EGRESOS
  // ==========================================
  async getCashFlowSummary(condominiumId: string, period?: string) {
    const ctx = RequestContextStore.getOrThrow();
    const currentPeriod = period || new Date().toISOString().slice(0, 7); // 'YYYY-MM'
    const fromDate = `${currentPeriod}-01`;
    const toDate = `${currentPeriod}-31`;

    // 1. Total Egresos (Gastos pagados)
    const paidExpenses = await this.expenseRepo.list(condominiumId, ctx.tenantId, {
      fromDate,
      toDate,
      status: "paid",
    });

    const totalExpenses = paidExpenses.reduce((sum, e) => sum + parseFloat(e.amount || "0"), 0);

    // 2. Total Ingresos (Pagos aprobados en el mes)
    const approvedPayments = await this.dbService.db
      .select({
        amount: payments.amount,
      })
      .from(payments)
      .where(
        and(
          eq(payments.condominiumId, condominiumId),
          eq(payments.tenantId, ctx.tenantId),
          eq(payments.status, "approved"),
          gte(payments.paymentDate, fromDate),
          lte(payments.paymentDate, toDate),
          isNull(payments.deletedAt)
        )
      );

    const totalIncome = approvedPayments.reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);
    const netBalance = totalIncome - totalExpenses;

    // 3. Cuentas por pagar (Total adeudado y facturas vencidas)
    const invoices = await this.supplierInvoiceRepo.list(condominiumId, ctx.tenantId);
    const todayStr = new Date().toISOString().split("T")[0];

    let totalAccountsPayable = 0;
    let overdueInvoicesCount = 0;
    let overdueAmount = 0;

    for (const inv of invoices) {
      if (inv.status !== "paid") {
        const pending = Math.max(0, parseFloat(inv.amount || "0") - parseFloat(inv.paidAmount || "0"));
        totalAccountsPayable += pending;

        if (inv.dueDate && inv.dueDate < todayStr) {
          overdueInvoicesCount++;
          overdueAmount += pending;
        }
      }
    }

    // 4. Desglose de egresos por categoría
    const categories = await this.categoryRepo.listByCondominium(condominiumId, ctx.tenantId);
    const categoryMap = new Map<string, { name: string; color: string; total: number }>();

    for (const cat of categories) {
      categoryMap.set(cat.id, { name: cat.name, color: cat.color || "blue", total: 0 });
    }

    for (const exp of paidExpenses) {
      const entry = categoryMap.get(exp.categoryId);
      if (entry) {
        entry.total += parseFloat(exp.amount || "0");
      }
    }

    const expensesByCategory = Array.from(categoryMap.values())
      .filter((c) => c.total > 0)
      .map((c) => ({
        name: c.name,
        color: c.color,
        amount: Math.round(c.total * 100) / 100,
        percentage: totalExpenses > 0 ? Math.round((c.total / totalExpenses) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      period: currentPeriod,
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      netBalance: Math.round(netBalance * 100) / 100,
      isSurplus: netBalance >= 0,
      totalAccountsPayable: Math.round(totalAccountsPayable * 100) / 100,
      overdueInvoicesCount,
      overdueAmount: Math.round(overdueAmount * 100) / 100,
      expensesCount: paidExpenses.length,
      expensesByCategory,
    };
  }
}
