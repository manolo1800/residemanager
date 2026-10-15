import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../../../common/database/database.service";
import { suppliers, supplierInvoices } from "@sgc/database";
import { and, eq, isNull, desc, ilike, or } from "drizzle-orm";

@Injectable()
export class SupplierRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async create(data: typeof suppliers.$inferInsert) {
    const [created] = await this.dbService.db
      .insert(suppliers)
      .values(data)
      .returning();
    return created;
  }

  async findById(id: string, tenantId: string) {
    const [supplier] = await this.dbService.db
      .select()
      .from(suppliers)
      .where(
        and(
          eq(suppliers.id, id),
          eq(suppliers.tenantId, tenantId),
          isNull(suppliers.deletedAt)
        )
      );
    return supplier || null;
  }

  async listByCondominium(condominiumId: string, tenantId: string, search?: string) {
    const conditions = [
      eq(suppliers.condominiumId, condominiumId),
      eq(suppliers.tenantId, tenantId),
      isNull(suppliers.deletedAt),
    ];

    if (search && search.trim().length > 0) {
      const term = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(suppliers.name, term),
          ilike(suppliers.taxId, term),
          ilike(suppliers.contact, term)
        )!
      );
    }

    return this.dbService.db
      .select()
      .from(suppliers)
      .where(and(...conditions))
      .orderBy(desc(suppliers.createdAt));
  }

  async update(id: string, tenantId: string, data: Partial<typeof suppliers.$inferInsert>) {
    const [updated] = await this.dbService.db
      .update(suppliers)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(suppliers.id, id),
          eq(suppliers.tenantId, tenantId),
          isNull(suppliers.deletedAt)
        )
      )
      .returning();
    return updated || null;
  }

  async softDelete(id: string, tenantId: string) {
    const [deleted] = await this.dbService.db
      .update(suppliers)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(suppliers.id, id),
          eq(suppliers.tenantId, tenantId),
          isNull(suppliers.deletedAt)
        )
      )
      .returning();
    return deleted || null;
  }
}
