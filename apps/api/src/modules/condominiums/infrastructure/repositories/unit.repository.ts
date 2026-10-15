import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../../../common/database/database.service";
import { condoStructures, units } from "@sgc/database";
import { eq, and, isNull, sql, ilike, or } from "drizzle-orm";

export interface UnitFilters {
  structureId?: string;
  type?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class UnitRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async findAll(condominiumId: string, tenantId: string, filters: UnitFilters = {}) {
    const conditions = [
      eq(units.condominiumId, condominiumId),
      eq(units.tenantId, tenantId),
      isNull(units.deletedAt),
    ];

    if (filters.structureId) {
      conditions.push(eq(units.structureId, filters.structureId));
    }
    if (filters.type) {
      conditions.push(eq(units.type, filters.type));
    }
    if (filters.status) {
      conditions.push(eq(units.status, filters.status));
    }
    if (filters.search) {
      conditions.push(ilike(units.code, `%${filters.search.trim()}%`));
    }

    let query = this.dbService.db
      .select({
        id: units.id,
        tenantId: units.tenantId,
        condominiumId: units.condominiumId,
        structureId: units.structureId,
        structureName: condoStructures.name,
        code: units.code,
        floor: units.floor,
        type: units.type,
        areaM2: units.areaM2,
        aliquotPct: units.aliquotPct,
        status: units.status,
        createdAt: units.createdAt,
        updatedAt: units.updatedAt,
      })
      .from(units)
      .leftJoin(
        condoStructures,
        and(eq(condoStructures.id, units.structureId), isNull(condoStructures.deletedAt))
      )
      .where(and(...conditions))
      .orderBy(condoStructures.position, units.floor, units.code);

    if (filters.limit) {
      query = query.limit(filters.limit) as any;
    }
    if (filters.offset) {
      query = query.offset(filters.offset) as any;
    }

    return query;
  }

  async count(condominiumId: string, tenantId: string, filters: UnitFilters = {}): Promise<number> {
    const conditions = [
      eq(units.condominiumId, condominiumId),
      eq(units.tenantId, tenantId),
      isNull(units.deletedAt),
    ];

    if (filters.structureId) {
      conditions.push(eq(units.structureId, filters.structureId));
    }
    if (filters.type) {
      conditions.push(eq(units.type, filters.type));
    }
    if (filters.status) {
      conditions.push(eq(units.status, filters.status));
    }
    if (filters.search) {
      conditions.push(ilike(units.code, `%${filters.search.trim()}%`));
    }

    const res = await this.dbService.db
      .select({ count: sql<number>`count(*)::int` })
      .from(units)
      .where(and(...conditions));

    return res[0]?.count || 0;
  }

  async findById(id: string, condominiumId: string, tenantId: string) {
    const results = await this.dbService.db
      .select({
        id: units.id,
        tenantId: units.tenantId,
        condominiumId: units.condominiumId,
        structureId: units.structureId,
        structureName: condoStructures.name,
        code: units.code,
        floor: units.floor,
        type: units.type,
        areaM2: units.areaM2,
        aliquotPct: units.aliquotPct,
        status: units.status,
        createdAt: units.createdAt,
        updatedAt: units.updatedAt,
      })
      .from(units)
      .leftJoin(
        condoStructures,
        and(eq(condoStructures.id, units.structureId), isNull(condoStructures.deletedAt))
      )
      .where(
        and(
          eq(units.id, id),
          eq(units.condominiumId, condominiumId),
          eq(units.tenantId, tenantId),
          isNull(units.deletedAt)
        )
      );
    return results[0] || null;
  }

  async findByCode(code: string, condominiumId: string, tenantId: string) {
    const results = await this.dbService.db
      .select()
      .from(units)
      .where(
        and(
          eq(units.code, code.trim()),
          eq(units.condominiumId, condominiumId),
          eq(units.tenantId, tenantId),
          isNull(units.deletedAt)
        )
      );
    return results[0] || null;
  }

  async create(data: typeof units.$inferInsert) {
    const [inserted] = await this.dbService.db
      .insert(units)
      .values(data)
      .returning();
    return inserted;
  }

  async createMany(dataList: (typeof units.$inferInsert)[]) {
    if (dataList.length === 0) return [];
    return this.dbService.db.insert(units).values(dataList).returning();
  }

  async update(
    id: string,
    condominiumId: string,
    tenantId: string,
    data: Partial<typeof units.$inferInsert>
  ) {
    const [updated] = await this.dbService.db
      .update(units)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(units.id, id),
          eq(units.condominiumId, condominiumId),
          eq(units.tenantId, tenantId),
          isNull(units.deletedAt)
        )
      )
      .returning();
    return updated;
  }

  async softDelete(id: string, condominiumId: string, tenantId: string) {
    const [deleted] = await this.dbService.db
      .update(units)
      .set({ deletedAt: new Date(), updatedAt: new Date(), status: "inactive" })
      .where(
        and(
          eq(units.id, id),
          eq(units.condominiumId, condominiumId),
          eq(units.tenantId, tenantId),
          isNull(units.deletedAt)
        )
      )
      .returning();
    return deleted;
  }
}
