import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../../../common/database/database.service";
import { paymentMethods } from "@sgc/database";
import { and, eq, isNull, desc } from "drizzle-orm";

@Injectable()
export class PaymentMethodRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async create(data: typeof paymentMethods.$inferInsert) {
    const [created] = await this.dbService.db
      .insert(paymentMethods)
      .values(data)
      .returning();
    return created;
  }

  async findById(id: string, tenantId: string) {
    const [method] = await this.dbService.db
      .select()
      .from(paymentMethods)
      .where(
        and(
          eq(paymentMethods.id, id),
          eq(paymentMethods.tenantId, tenantId),
          isNull(paymentMethods.deletedAt)
        )
      );
    return method || null;
  }

  async listByCondominium(condominiumId: string, tenantId: string, onlyActive = false) {
    const conditions = [
      eq(paymentMethods.condominiumId, condominiumId),
      eq(paymentMethods.tenantId, tenantId),
      isNull(paymentMethods.deletedAt),
    ];

    if (onlyActive) {
      conditions.push(eq(paymentMethods.isActive, true));
    }

    return this.dbService.db
      .select()
      .from(paymentMethods)
      .where(and(...conditions))
      .orderBy(desc(paymentMethods.createdAt));
  }

  async update(id: string, tenantId: string, data: Partial<typeof paymentMethods.$inferInsert>) {
    const [updated] = await this.dbService.db
      .update(paymentMethods)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(paymentMethods.id, id),
          eq(paymentMethods.tenantId, tenantId),
          isNull(paymentMethods.deletedAt)
        )
      )
      .returning();
    return updated || null;
  }

  async softDelete(id: string, tenantId: string) {
    const [deleted] = await this.dbService.db
      .update(paymentMethods)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(paymentMethods.id, id),
          eq(paymentMethods.tenantId, tenantId),
          isNull(paymentMethods.deletedAt)
        )
      )
      .returning();
    return deleted || null;
  }
}
