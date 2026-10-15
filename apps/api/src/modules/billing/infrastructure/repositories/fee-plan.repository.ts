import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../../../common/database/database.service";
import { feePlans, condoStructures, units } from "@sgc/database";
import { and, eq, isNull, lte, gte, or, desc } from "drizzle-orm";

@Injectable()
export class FeePlanRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async create(data: typeof feePlans.$inferInsert) {
    const [created] = await this.dbService.db.insert(feePlans).values(data).returning();
    return created;
  }

  async findById(id: string, tenantId: string) {
    const [result] = await this.dbService.db
      .select({
        feePlan: feePlans,
        structureName: condoStructures.name,
        unitCode: units.code,
      })
      .from(feePlans)
      .leftJoin(condoStructures, eq(feePlans.structureId, condoStructures.id))
      .leftJoin(units, eq(feePlans.unitId, units.id))
      .where(and(eq(feePlans.id, id), eq(feePlans.tenantId, tenantId), isNull(feePlans.deletedAt)));

    return result || null;
  }

  async listByCondominium(
    condominiumId: string,
    tenantId: string,
    filters?: { type?: string; status?: string }
  ) {
    const conditions = [
      eq(feePlans.condominiumId, condominiumId),
      eq(feePlans.tenantId, tenantId),
      isNull(feePlans.deletedAt),
    ];

    if (filters?.type) {
      conditions.push(eq(feePlans.type, filters.type));
    }
    if (filters?.status) {
      conditions.push(eq(feePlans.status, filters.status));
    }

    return this.dbService.db
      .select({
        feePlan: feePlans,
        structureName: condoStructures.name,
        unitCode: units.code,
      })
      .from(feePlans)
      .leftJoin(condoStructures, eq(feePlans.structureId, condoStructures.id))
      .leftJoin(units, eq(feePlans.unitId, units.id))
      .where(and(...conditions))
      .orderBy(desc(feePlans.createdAt));
  }

  async update(id: string, tenantId: string, data: Partial<typeof feePlans.$inferInsert>) {
    const [updated] = await this.dbService.db
      .update(feePlans)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(feePlans.id, id), eq(feePlans.tenantId, tenantId), isNull(feePlans.deletedAt)))
      .returning();

    return updated || null;
  }

  async findActivePlansForCondominium(condominiumId: string, tenantId: string, periodDate: string) {
    // periodDate is in 'YYYY-MM-DD'
    return this.dbService.db
      .select()
      .from(feePlans)
      .where(
        and(
          eq(feePlans.condominiumId, condominiumId),
          eq(feePlans.tenantId, tenantId),
          eq(feePlans.status, "active"),
          isNull(feePlans.deletedAt),
          lte(feePlans.startDate, periodDate),
          or(isNull(feePlans.endDate), gte(feePlans.endDate, periodDate))
        )
      );
  }
}
