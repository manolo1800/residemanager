import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../../../common/database/database.service";
import { condoStructures, units } from "@sgc/database";
import { eq, and, isNull, sql } from "drizzle-orm";

@Injectable()
export class StructureRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async findByCondo(condominiumId: string, tenantId: string) {
    const list = await this.dbService.db
      .select({
        id: condoStructures.id,
        tenantId: condoStructures.tenantId,
        condominiumId: condoStructures.condominiumId,
        name: condoStructures.name,
        kind: condoStructures.kind,
        floors: condoStructures.floors,
        position: condoStructures.position,
        createdAt: condoStructures.createdAt,
        updatedAt: condoStructures.updatedAt,
        unitsCount: sql<number>`count(${units.id})::int`,
      })
      .from(condoStructures)
      .leftJoin(
        units,
        and(eq(units.structureId, condoStructures.id), isNull(units.deletedAt))
      )
      .where(
        and(
          eq(condoStructures.condominiumId, condominiumId),
          eq(condoStructures.tenantId, tenantId),
          isNull(condoStructures.deletedAt)
        )
      )
      .groupBy(condoStructures.id)
      .orderBy(condoStructures.position, condoStructures.name);

    return list;
  }

  async findById(id: string, condominiumId: string, tenantId: string) {
    const results = await this.dbService.db
      .select()
      .from(condoStructures)
      .where(
        and(
          eq(condoStructures.id, id),
          eq(condoStructures.condominiumId, condominiumId),
          eq(condoStructures.tenantId, tenantId),
          isNull(condoStructures.deletedAt)
        )
      );
    return results[0] || null;
  }

  async findByName(name: string, condominiumId: string, tenantId: string) {
    const results = await this.dbService.db
      .select()
      .from(condoStructures)
      .where(
        and(
          eq(condoStructures.name, name.trim()),
          eq(condoStructures.condominiumId, condominiumId),
          eq(condoStructures.tenantId, tenantId),
          isNull(condoStructures.deletedAt)
        )
      );
    return results[0] || null;
  }

  async countUnitsInStructure(structureId: string): Promise<number> {
    const res = await this.dbService.db
      .select({ count: sql<number>`count(*)::int` })
      .from(units)
      .where(
        and(
          eq(units.structureId, structureId),
          isNull(units.deletedAt)
        )
      );
    return res[0]?.count || 0;
  }

  async create(data: typeof condoStructures.$inferInsert) {
    const [inserted] = await this.dbService.db
      .insert(condoStructures)
      .values(data)
      .returning();
    return inserted;
  }

  async update(
    id: string,
    condominiumId: string,
    tenantId: string,
    data: Partial<typeof condoStructures.$inferInsert>
  ) {
    const [updated] = await this.dbService.db
      .update(condoStructures)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(condoStructures.id, id),
          eq(condoStructures.condominiumId, condominiumId),
          eq(condoStructures.tenantId, tenantId),
          isNull(condoStructures.deletedAt)
        )
      )
      .returning();
    return updated;
  }

  async softDelete(id: string, condominiumId: string, tenantId: string) {
    const [deleted] = await this.dbService.db
      .update(condoStructures)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(condoStructures.id, id),
          eq(condoStructures.condominiumId, condominiumId),
          eq(condoStructures.tenantId, tenantId),
          isNull(condoStructures.deletedAt)
        )
      )
      .returning();
    return deleted;
  }
}
