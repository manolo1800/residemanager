import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../../../common/database/database.service";
import { budgets, expenseCategories } from "@sgc/database";
import { and, eq, isNull, desc } from "drizzle-orm";

@Injectable()
export class BudgetRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async create(data: typeof budgets.$inferInsert) {
    const [created] = await this.dbService.db
      .insert(budgets)
      .values(data)
      .returning();
    return created;
  }

  async findById(id: string, tenantId: string) {
    const [budget] = await this.dbService.db
      .select({
        budget: budgets,
        category: expenseCategories,
      })
      .from(budgets)
      .innerJoin(expenseCategories, eq(budgets.categoryId, expenseCategories.id))
      .where(
        and(
          eq(budgets.id, id),
          eq(budgets.tenantId, tenantId),
          isNull(budgets.deletedAt)
        )
      );
    return budget || null;
  }

  async findByPeriodAndCategory(condominiumId: string, categoryId: string, period: string, tenantId: string) {
    const [budget] = await this.dbService.db
      .select()
      .from(budgets)
      .where(
        and(
          eq(budgets.condominiumId, condominiumId),
          eq(budgets.categoryId, categoryId),
          eq(budgets.period, period),
          eq(budgets.tenantId, tenantId),
          isNull(budgets.deletedAt)
        )
      );
    return budget || null;
  }

  async listByCondominium(condominiumId: string, tenantId: string, period?: string) {
    const conditions = [
      eq(budgets.condominiumId, condominiumId),
      eq(budgets.tenantId, tenantId),
      isNull(budgets.deletedAt),
    ];

    if (period) {
      conditions.push(eq(budgets.period, period));
    }

    return this.dbService.db
      .select({
        id: budgets.id,
        tenantId: budgets.tenantId,
        condominiumId: budgets.condominiumId,
        categoryId: budgets.categoryId,
        categoryName: expenseCategories.name,
        categoryColor: expenseCategories.color,
        period: budgets.period,
        amount: budgets.amount,
        currency: budgets.currency,
        alertThresholdPct: budgets.alertThresholdPct,
        notes: budgets.notes,
        createdAt: budgets.createdAt,
        updatedAt: budgets.updatedAt,
      })
      .from(budgets)
      .innerJoin(expenseCategories, eq(budgets.categoryId, expenseCategories.id))
      .where(and(...conditions))
      .orderBy(desc(budgets.period), expenseCategories.name);
  }

  async update(id: string, tenantId: string, data: Partial<typeof budgets.$inferInsert>) {
    const [updated] = await this.dbService.db
      .update(budgets)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(budgets.id, id),
          eq(budgets.tenantId, tenantId),
          isNull(budgets.deletedAt)
        )
      )
      .returning();
    return updated || null;
  }

  async softDelete(id: string, tenantId: string) {
    const [deleted] = await this.dbService.db
      .update(budgets)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(budgets.id, id),
          eq(budgets.tenantId, tenantId),
          isNull(budgets.deletedAt)
        )
      )
      .returning();
    return deleted || null;
  }
}
