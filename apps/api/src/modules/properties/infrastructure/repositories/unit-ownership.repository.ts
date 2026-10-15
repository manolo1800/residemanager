import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../../../common/database/database.service";
import {
  unitOwnerships,
  persons,
  units,
  condominiums,
  condoStructures,
  residentProfiles,
} from "@sgc/database";
import { and, desc, eq, isNull } from "drizzle-orm";

@Injectable()
export class UnitOwnershipRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async findById(id: string, tenantId: string) {
    const results = await this.dbService.db
      .select({
        ownership: unitOwnerships,
        person: persons,
      })
      .from(unitOwnerships)
      .innerJoin(persons, eq(unitOwnerships.personId, persons.id))
      .where(and(eq(unitOwnerships.id, id), eq(unitOwnerships.tenantId, tenantId), isNull(unitOwnerships.deletedAt)));
    return results[0] || null;
  }

  async findActiveForUnit(unitId: string, tenantId: string) {
    const results = await this.dbService.db
      .select({
        ownership: unitOwnerships,
        person: persons,
      })
      .from(unitOwnerships)
      .innerJoin(persons, eq(unitOwnerships.personId, persons.id))
      .where(
        and(
          eq(unitOwnerships.unitId, unitId),
          eq(unitOwnerships.tenantId, tenantId),
          eq(unitOwnerships.status, "active"),
          isNull(unitOwnerships.deletedAt)
        )
      );
    return results[0] || null;
  }

  async listForUnit(unitId: string, tenantId: string) {
    const results = await this.dbService.db
      .select({
        ownership: unitOwnerships,
        person: persons,
      })
      .from(unitOwnerships)
      .innerJoin(persons, eq(unitOwnerships.personId, persons.id))
      .where(
        and(
          eq(unitOwnerships.unitId, unitId),
          eq(unitOwnerships.tenantId, tenantId),
          isNull(unitOwnerships.deletedAt)
        )
      )
      .orderBy(desc(unitOwnerships.createdAt));

    return results.map((r) => ({
      ...r.ownership,
      person: r.person,
    }));
  }

  async create(data: {
    tenantId: string;
    condominiumId: string;
    unitId: string;
    personId: string;
    startDate: string;
    isPrimaryResidence?: boolean;
    status?: string;
  }) {
    const [inserted] = await this.dbService.db
      .insert(unitOwnerships)
      .values({
        tenantId: data.tenantId,
        condominiumId: data.condominiumId,
        unitId: data.unitId,
        personId: data.personId,
        startDate: data.startDate,
        isPrimaryResidence: data.isPrimaryResidence || false,
        status: data.status || "active",
      })
      .returning();
    return inserted;
  }

  async update(id: string, tenantId: string, data: Partial<typeof unitOwnerships.$inferInsert>) {
    const [updated] = await this.dbService.db
      .update(unitOwnerships)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(unitOwnerships.id, id), eq(unitOwnerships.tenantId, tenantId), isNull(unitOwnerships.deletedAt)))
      .returning();
    return updated;
  }

  async listForUser(userId: string, tenantId: string) {
    const results = await this.dbService.db
      .select({
        ownership: unitOwnerships,
        unit: units,
        condominium: condominiums,
        structure: condoStructures,
      })
      .from(residentProfiles)
      .innerJoin(persons, eq(residentProfiles.personId, persons.id))
      .innerJoin(unitOwnerships, eq(persons.id, unitOwnerships.personId))
      .innerJoin(units, eq(unitOwnerships.unitId, units.id))
      .innerJoin(condominiums, eq(unitOwnerships.condominiumId, condominiums.id))
      .leftJoin(condoStructures, eq(units.structureId, condoStructures.id))
      .where(
        and(
          eq(residentProfiles.userId, userId),
          eq(unitOwnerships.tenantId, tenantId),
          eq(unitOwnerships.status, "active"),
          isNull(unitOwnerships.deletedAt),
          isNull(residentProfiles.deletedAt)
        )
      )
      .orderBy(desc(unitOwnerships.createdAt));

    return results.map((r) => ({
      ownershipId: r.ownership.id,
      unitId: r.unit.id,
      unitCode: r.unit.code,
      unitType: r.unit.type,
      structureName: r.structure?.name || null,
      condominiumId: r.condominium.id,
      condominiumName: r.condominium.name,
      condominiumCode: r.condominium.code,
      condominiumAddress: r.condominium.address,
      startDate: r.ownership.startDate,
      isPrimaryResidence: r.ownership.isPrimaryResidence,
      status: r.ownership.status,
    }));
  }
}
