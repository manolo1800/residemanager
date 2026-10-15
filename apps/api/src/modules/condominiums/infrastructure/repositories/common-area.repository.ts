import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../../../common/database/database.service";
import { commonAreas } from "@sgc/database";
import { eq, and, isNull } from "drizzle-orm";

@Injectable()
export class CommonAreaRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async findAll(condominiumId: string, tenantId: string) {
    return this.dbService.db
      .select()
      .from(commonAreas)
      .where(
        and(
          eq(commonAreas.condominiumId, condominiumId),
          eq(commonAreas.tenantId, tenantId),
          isNull(commonAreas.deletedAt)
        )
      )
      .orderBy(commonAreas.name);
  }

  async findById(id: string, condominiumId: string, tenantId: string) {
    const results = await this.dbService.db
      .select()
      .from(commonAreas)
      .where(
        and(
          eq(commonAreas.id, id),
          eq(commonAreas.condominiumId, condominiumId),
          eq(commonAreas.tenantId, tenantId),
          isNull(commonAreas.deletedAt)
        )
      );
    return results[0] || null;
  }

  async create(data: typeof commonAreas.$inferInsert) {
    const [inserted] = await this.dbService.db
      .insert(commonAreas)
      .values(data)
      .returning();
    return inserted;
  }

  async update(
    id: string,
    condominiumId: string,
    tenantId: string,
    data: Partial<typeof commonAreas.$inferInsert>
  ) {
    const [updated] = await this.dbService.db
      .update(commonAreas)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(commonAreas.id, id),
          eq(commonAreas.condominiumId, condominiumId),
          eq(commonAreas.tenantId, tenantId),
          isNull(commonAreas.deletedAt)
        )
      )
      .returning();
    return updated;
  }

  async softDelete(id: string, condominiumId: string, tenantId: string) {
    const [deleted] = await this.dbService.db
      .update(commonAreas)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(commonAreas.id, id),
          eq(commonAreas.condominiumId, condominiumId),
          eq(commonAreas.tenantId, tenantId),
          isNull(commonAreas.deletedAt)
        )
      )
      .returning();
    return deleted;
  }
}
