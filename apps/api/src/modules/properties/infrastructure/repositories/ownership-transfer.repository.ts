import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../../../common/database/database.service";
import { ownershipTransfers, persons, units } from "@sgc/database";
import { and, desc, eq, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

@Injectable()
export class OwnershipTransferRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async findById(id: string, tenantId: string) {
    const fromPerson = alias(persons, "fromPerson");
    const toPerson = alias(persons, "toPerson");

    const results = await this.dbService.db
      .select({
        transfer: ownershipTransfers,
        unit: units,
        from: fromPerson,
        to: toPerson,
      })
      .from(ownershipTransfers)
      .innerJoin(units, eq(ownershipTransfers.unitId, units.id))
      .innerJoin(fromPerson, eq(ownershipTransfers.fromPersonId, fromPerson.id))
      .innerJoin(toPerson, eq(ownershipTransfers.toPersonId, toPerson.id))
      .where(
        and(
          eq(ownershipTransfers.id, id),
          eq(ownershipTransfers.tenantId, tenantId),
          isNull(ownershipTransfers.deletedAt)
        )
      );

    if (!results[0]) return null;
    const r = results[0];
    return {
      ...r.transfer,
      unit: r.unit,
      fromPerson: r.from,
      toPerson: r.to,
    };
  }

  async listForCondominium(condominiumId: string, tenantId: string, status?: string) {
    const fromPerson = alias(persons, "fromPerson");
    const toPerson = alias(persons, "toPerson");

    const conditions = [
      eq(ownershipTransfers.condominiumId, condominiumId),
      eq(ownershipTransfers.tenantId, tenantId),
      isNull(ownershipTransfers.deletedAt),
    ];
    if (status) {
      conditions.push(eq(ownershipTransfers.status, status));
    }

    const results = await this.dbService.db
      .select({
        transfer: ownershipTransfers,
        unit: units,
        from: fromPerson,
        to: toPerson,
      })
      .from(ownershipTransfers)
      .innerJoin(units, eq(ownershipTransfers.unitId, units.id))
      .innerJoin(fromPerson, eq(ownershipTransfers.fromPersonId, fromPerson.id))
      .innerJoin(toPerson, eq(ownershipTransfers.toPersonId, toPerson.id))
      .where(and(...conditions))
      .orderBy(desc(ownershipTransfers.createdAt));

    return results.map((r) => ({
      ...r.transfer,
      unit: r.unit,
      fromPerson: r.from,
      toPerson: r.to,
    }));
  }

  async create(data: {
    tenantId: string;
    condominiumId: string;
    unitId: string;
    fromPersonId: string;
    toPersonId: string;
    contractFileUrl: string;
  }) {
    const [inserted] = await this.dbService.db
      .insert(ownershipTransfers)
      .values({
        tenantId: data.tenantId,
        condominiumId: data.condominiumId,
        unitId: data.unitId,
        fromPersonId: data.fromPersonId,
        toPersonId: data.toPersonId,
        contractFileUrl: data.contractFileUrl,
        status: "pending",
      })
      .returning();
    return inserted;
  }

  async update(id: string, tenantId: string, data: Partial<typeof ownershipTransfers.$inferInsert>) {
    const [updated] = await this.dbService.db
      .update(ownershipTransfers)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(ownershipTransfers.id, id),
          eq(ownershipTransfers.tenantId, tenantId),
          isNull(ownershipTransfers.deletedAt)
        )
      )
      .returning();
    return updated;
  }
}
