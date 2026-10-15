import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../../../common/database/database.service";
import { parkingSpots, units } from "@sgc/database";
import { eq, and, isNull } from "drizzle-orm";

@Injectable()
export class ParkingSpotRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async findAll(condominiumId: string, tenantId: string) {
    return this.dbService.db
      .select({
        id: parkingSpots.id,
        tenantId: parkingSpots.tenantId,
        condominiumId: parkingSpots.condominiumId,
        code: parkingSpots.code,
        type: parkingSpots.type,
        assignedUnitId: parkingSpots.assignedUnitId,
        assignedUnitCode: units.code,
        createdAt: parkingSpots.createdAt,
        updatedAt: parkingSpots.updatedAt,
      })
      .from(parkingSpots)
      .leftJoin(
        units,
        and(eq(units.id, parkingSpots.assignedUnitId), isNull(units.deletedAt))
      )
      .where(
        and(
          eq(parkingSpots.condominiumId, condominiumId),
          eq(parkingSpots.tenantId, tenantId),
          isNull(parkingSpots.deletedAt)
        )
      )
      .orderBy(parkingSpots.code);
  }

  async findById(id: string, condominiumId: string, tenantId: string) {
    const results = await this.dbService.db
      .select({
        id: parkingSpots.id,
        tenantId: parkingSpots.tenantId,
        condominiumId: parkingSpots.condominiumId,
        code: parkingSpots.code,
        type: parkingSpots.type,
        assignedUnitId: parkingSpots.assignedUnitId,
        assignedUnitCode: units.code,
        createdAt: parkingSpots.createdAt,
        updatedAt: parkingSpots.updatedAt,
      })
      .from(parkingSpots)
      .leftJoin(
        units,
        and(eq(units.id, parkingSpots.assignedUnitId), isNull(units.deletedAt))
      )
      .where(
        and(
          eq(parkingSpots.id, id),
          eq(parkingSpots.condominiumId, condominiumId),
          eq(parkingSpots.tenantId, tenantId),
          isNull(parkingSpots.deletedAt)
        )
      );
    return results[0] || null;
  }

  async findByCode(code: string, condominiumId: string, tenantId: string) {
    const results = await this.dbService.db
      .select()
      .from(parkingSpots)
      .where(
        and(
          eq(parkingSpots.code, code.trim()),
          eq(parkingSpots.condominiumId, condominiumId),
          eq(parkingSpots.tenantId, tenantId),
          isNull(parkingSpots.deletedAt)
        )
      );
    return results[0] || null;
  }

  async create(data: typeof parkingSpots.$inferInsert) {
    const [inserted] = await this.dbService.db
      .insert(parkingSpots)
      .values(data)
      .returning();
    return inserted;
  }

  async update(
    id: string,
    condominiumId: string,
    tenantId: string,
    data: Partial<typeof parkingSpots.$inferInsert>
  ) {
    const [updated] = await this.dbService.db
      .update(parkingSpots)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(parkingSpots.id, id),
          eq(parkingSpots.condominiumId, condominiumId),
          eq(parkingSpots.tenantId, tenantId),
          isNull(parkingSpots.deletedAt)
        )
      )
      .returning();
    return updated;
  }

  async softDelete(id: string, condominiumId: string, tenantId: string) {
    const [deleted] = await this.dbService.db
      .update(parkingSpots)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(parkingSpots.id, id),
          eq(parkingSpots.condominiumId, condominiumId),
          eq(parkingSpots.tenantId, tenantId),
          isNull(parkingSpots.deletedAt)
        )
      )
      .returning();
    return deleted;
  }
}
