import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../../../common/database/database.service";
import { expenses, expenseCategories, suppliers } from "@sgc/database";
import { and, eq, isNull, desc, gte, lte } from "drizzle-orm";

@Injectable()
export class ExpenseRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async create(data: typeof expenses.$inferInsert) {
    const [created] = await this.dbService.db
      .insert(expenses)
      .values(data)
      .returning();
    return created;
  }

  async findById(id: string, tenantId: string) {
    const [expense] = await this.dbService.db
      .select({
        id: expenses.id,
        tenantId: expenses.tenantId,
        condominiumId: expenses.condominiumId,
        categoryId: expenses.categoryId,
        categoryName: expenseCategories.name,
        categoryColor: expenseCategories.color,
        supplierId: expenses.supplierId,
        supplierName: suppliers.name,
        concept: expenses.concept,
        description: expenses.description,
        amount: expenses.amount,
        currency: expenses.currency,
        exchangeRate: expenses.exchangeRate,
        amountBaseCurrency: expenses.amountBaseCurrency,
        expenseDate: expenses.expenseDate,
        receiptUrl: expenses.receiptUrl,
        status: expenses.status,
        isBankCommission: expenses.isBankCommission,
        sourceBankMovementId: expenses.sourceBankMovementId,
        paymentMethod: expenses.paymentMethod,
        referenceNumber: expenses.referenceNumber,
        createdBy: expenses.createdBy,
        createdAt: expenses.createdAt,
        updatedAt: expenses.updatedAt,
      })
      .from(expenses)
      .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
      .leftJoin(suppliers, eq(expenses.supplierId, suppliers.id))
      .where(
        and(
          eq(expenses.id, id),
          eq(expenses.tenantId, tenantId),
          isNull(expenses.deletedAt)
        )
      );
    return expense || null;
  }

  async list(
    condominiumId: string,
    tenantId: string,
    filters?: {
      categoryId?: string;
      supplierId?: string;
      status?: string;
      isBankCommission?: boolean;
      fromDate?: string;
      toDate?: string;
    }
  ) {
    const conditions = [
      eq(expenses.condominiumId, condominiumId),
      eq(expenses.tenantId, tenantId),
      isNull(expenses.deletedAt),
    ];

    if (filters?.categoryId) {
      conditions.push(eq(expenses.categoryId, filters.categoryId));
    }
    if (filters?.supplierId) {
      conditions.push(eq(expenses.supplierId, filters.supplierId));
    }
    if (filters?.status) {
      conditions.push(eq(expenses.status, filters.status));
    }
    if (filters?.isBankCommission !== undefined) {
      conditions.push(eq(expenses.isBankCommission, filters.isBankCommission));
    }
    if (filters?.fromDate) {
      conditions.push(gte(expenses.expenseDate, filters.fromDate));
    }
    if (filters?.toDate) {
      conditions.push(lte(expenses.expenseDate, filters.toDate));
    }

    return this.dbService.db
      .select({
        id: expenses.id,
        tenantId: expenses.tenantId,
        condominiumId: expenses.condominiumId,
        categoryId: expenses.categoryId,
        categoryName: expenseCategories.name,
        categoryColor: expenseCategories.color,
        supplierId: expenses.supplierId,
        supplierName: suppliers.name,
        concept: expenses.concept,
        description: expenses.description,
        amount: expenses.amount,
        currency: expenses.currency,
        exchangeRate: expenses.exchangeRate,
        amountBaseCurrency: expenses.amountBaseCurrency,
        expenseDate: expenses.expenseDate,
        receiptUrl: expenses.receiptUrl,
        status: expenses.status,
        isBankCommission: expenses.isBankCommission,
        paymentMethod: expenses.paymentMethod,
        referenceNumber: expenses.referenceNumber,
        createdAt: expenses.createdAt,
        updatedAt: expenses.updatedAt,
      })
      .from(expenses)
      .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
      .leftJoin(suppliers, eq(expenses.supplierId, suppliers.id))
      .where(and(...conditions))
      .orderBy(desc(expenses.expenseDate), desc(expenses.createdAt));
  }

  async update(id: string, tenantId: string, data: Partial<typeof expenses.$inferInsert>) {
    const [updated] = await this.dbService.db
      .update(expenses)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(expenses.id, id),
          eq(expenses.tenantId, tenantId),
          isNull(expenses.deletedAt)
        )
      )
      .returning();
    return updated || null;
  }

  async softDelete(id: string, tenantId: string) {
    const [deleted] = await this.dbService.db
      .update(expenses)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(expenses.id, id),
          eq(expenses.tenantId, tenantId),
          isNull(expenses.deletedAt)
        )
      )
      .returning();
    return deleted || null;
  }
}
