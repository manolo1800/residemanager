import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../../../common/database/database.service";
import { expenseCategories } from "@sgc/database";
import { and, eq, isNull, asc } from "drizzle-orm";

@Injectable()
export class ExpenseCategoryRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async create(data: typeof expenseCategories.$inferInsert) {
    const [created] = await this.dbService.db
      .insert(expenseCategories)
      .values(data)
      .returning();
    return created;
  }

  async findById(id: string, tenantId: string) {
    const [category] = await this.dbService.db
      .select()
      .from(expenseCategories)
      .where(
        and(
          eq(expenseCategories.id, id),
          eq(expenseCategories.tenantId, tenantId),
          isNull(expenseCategories.deletedAt)
        )
      );
    return category || null;
  }

  async listByCondominium(condominiumId: string, tenantId: string) {
    return this.dbService.db
      .select()
      .from(expenseCategories)
      .where(
        and(
          eq(expenseCategories.condominiumId, condominiumId),
          eq(expenseCategories.tenantId, tenantId),
          isNull(expenseCategories.deletedAt)
        )
      )
      .orderBy(asc(expenseCategories.name));
  }

  async update(id: string, tenantId: string, data: Partial<typeof expenseCategories.$inferInsert>) {
    const [updated] = await this.dbService.db
      .update(expenseCategories)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(expenseCategories.id, id),
          eq(expenseCategories.tenantId, tenantId),
          isNull(expenseCategories.deletedAt)
        )
      )
      .returning();
    return updated || null;
  }

  async softDelete(id: string, tenantId: string) {
    const [deleted] = await this.dbService.db
      .update(expenseCategories)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(expenseCategories.id, id),
          eq(expenseCategories.tenantId, tenantId),
          isNull(expenseCategories.deletedAt)
        )
      )
      .returning();
    return deleted || null;
  }
}
