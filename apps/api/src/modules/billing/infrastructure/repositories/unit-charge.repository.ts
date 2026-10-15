import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../../../common/database/database.service";
import { unitCharges, feePlans, units, condoStructures, unitOwnerships, persons } from "@sgc/database";
import { and, eq, isNull, lte, desc, sql, inArray } from "drizzle-orm";

@Injectable()
export class UnitChargeRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async create(data: typeof unitCharges.$inferInsert) {
    const [created] = await this.dbService.db
      .insert(unitCharges)
      .values(data)
      .onConflictDoNothing()
      .returning();
    return created || null;
  }

  async findByUnitPlanAndPeriod(unitId: string, feePlanId: string, period: string, tenantId: string) {
    const [result] = await this.dbService.db
      .select()
      .from(unitCharges)
      .where(
        and(
          eq(unitCharges.unitId, unitId),
          eq(unitCharges.feePlanId, feePlanId),
          eq(unitCharges.period, period),
          eq(unitCharges.tenantId, tenantId),
          isNull(unitCharges.deletedAt)
        )
      );
    return result || null;
  }

  async listByCondominium(
    condominiumId: string,
    tenantId: string,
    filters?: { period?: string; status?: string; unitId?: string }
  ) {
    const conditions = [
      eq(unitCharges.condominiumId, condominiumId),
      eq(unitCharges.tenantId, tenantId),
      isNull(unitCharges.deletedAt),
    ];

    if (filters?.period) {
      conditions.push(eq(unitCharges.period, filters.period));
    }
    if (filters?.status) {
      conditions.push(eq(unitCharges.status, filters.status));
    }
    if (filters?.unitId) {
      conditions.push(eq(unitCharges.unitId, filters.unitId));
    }

    return this.dbService.db
      .select({
        charge: unitCharges,
        feePlanName: feePlans.name,
        feePlanType: feePlans.type,
        unitCode: units.code,
        structureId: units.structureId,
        structureName: condoStructures.name,
      })
      .from(unitCharges)
      .innerJoin(feePlans, eq(unitCharges.feePlanId, feePlans.id))
      .innerJoin(units, eq(unitCharges.unitId, units.id))
      .leftJoin(condoStructures, eq(units.structureId, condoStructures.id))
      .where(and(...conditions))
      .orderBy(desc(unitCharges.period), desc(unitCharges.createdAt));
  }

  async listByUnit(unitId: string, tenantId: string) {
    return this.dbService.db
      .select({
        charge: unitCharges,
        feePlanName: feePlans.name,
        feePlanType: feePlans.type,
      })
      .from(unitCharges)
      .innerJoin(feePlans, eq(unitCharges.feePlanId, feePlans.id))
      .where(
        and(
          eq(unitCharges.unitId, unitId),
          eq(unitCharges.tenantId, tenantId),
          isNull(unitCharges.deletedAt)
        )
      )
      .orderBy(desc(unitCharges.period), desc(unitCharges.dueDate));
  }

  async update(id: string, tenantId: string, data: Partial<typeof unitCharges.$inferInsert>) {
    const [updated] = await this.dbService.db
      .update(unitCharges)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(unitCharges.id, id), eq(unitCharges.tenantId, tenantId), isNull(unitCharges.deletedAt)))
      .returning();
    return updated || null;
  }

  async findPendingOverdue(condominiumId: string, tenantId: string, currentDate: string) {
    return this.dbService.db
      .select()
      .from(unitCharges)
      .where(
        and(
          eq(unitCharges.condominiumId, condominiumId),
          eq(unitCharges.tenantId, tenantId),
          isNull(unitCharges.deletedAt),
          inArray(unitCharges.status, ["pending", "partially_paid"]),
          lte(unitCharges.dueDate, currentDate)
        )
      );
  }

  async getMorosityData(condominiumId: string, tenantId: string, structureId?: string) {
    const conditions = [
      eq(unitCharges.condominiumId, condominiumId),
      eq(unitCharges.tenantId, tenantId),
      isNull(unitCharges.deletedAt),
      inArray(unitCharges.status, ["overdue", "pending", "partially_paid"]),
    ];

    if (structureId) {
      conditions.push(eq(units.structureId, structureId));
    }

    const rows = await this.dbService.db
      .select({
        chargeId: unitCharges.id,
        unitId: unitCharges.unitId,
        period: unitCharges.period,
        amountBase: unitCharges.amountBase,
        taxAmount: unitCharges.taxAmount,
        moraAmount: unitCharges.moraAmount,
        totalAmount: unitCharges.totalAmount,
        paidAmount: unitCharges.paidAmount,
        currency: unitCharges.currency,
        status: unitCharges.status,
        dueDate: unitCharges.dueDate,
        unitCode: units.code,
        structureId: units.structureId,
        structureName: condoStructures.name,
      })
      .from(unitCharges)
      .innerJoin(units, eq(unitCharges.unitId, units.id))
      .leftJoin(condoStructures, eq(units.structureId, condoStructures.id))
      .where(and(...conditions))
      .orderBy(unitCharges.dueDate);

    return rows;
  }
}
