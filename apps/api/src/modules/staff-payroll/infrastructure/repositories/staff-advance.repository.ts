import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../../../common/database/database.service";
import { staffAdvances, staff, persons } from "@sgc/database";
import { and, eq, isNull, desc } from "drizzle-orm";

@Injectable()
export class StaffAdvanceRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async create(data: typeof staffAdvances.$inferInsert) {
    const [created] = await this.dbService.db
      .insert(staffAdvances)
      .values(data)
      .returning();
    return created;
  }

  async findById(id: string, tenantId: string) {
    const [row] = await this.dbService.db
      .select({
        id: staffAdvances.id,
        tenantId: staffAdvances.tenantId,
        staffId: staffAdvances.staffId,
        amount: staffAdvances.amount,
        currency: staffAdvances.currency,
        reason: staffAdvances.reason,
        requestedAt: staffAdvances.requestedAt,
        approvedBy: staffAdvances.approvedBy,
        installments: staffAdvances.installments,
        remaining: staffAdvances.remaining,
        status: staffAdvances.status,
        createdAt: staffAdvances.createdAt,
        position: staff.position,
        personName: persons.fullName,
      })
      .from(staffAdvances)
      .innerJoin(staff, eq(staffAdvances.staffId, staff.id))
      .innerJoin(persons, eq(staff.personId, persons.id))
      .where(and(eq(staffAdvances.id, id), eq(staffAdvances.tenantId, tenantId), isNull(staffAdvances.deletedAt)));
    return row || null;
  }

  async listByStaff(staffId: string, tenantId: string) {
    return this.dbService.db
      .select()
      .from(staffAdvances)
      .where(and(eq(staffAdvances.staffId, staffId), eq(staffAdvances.tenantId, tenantId), isNull(staffAdvances.deletedAt)))
      .orderBy(desc(staffAdvances.requestedAt));
  }

  async listActiveApprovedByStaff(staffId: string, tenantId: string) {
    return this.dbService.db
      .select()
      .from(staffAdvances)
      .where(
        and(
          eq(staffAdvances.staffId, staffId),
          eq(staffAdvances.tenantId, tenantId),
          eq(staffAdvances.status, "approved"),
          isNull(staffAdvances.deletedAt)
        )
      )
      .orderBy(staffAdvances.requestedAt);
  }

  async listByCondominium(condominiumId: string, tenantId: string) {
    return this.dbService.db
      .select({
        id: staffAdvances.id,
        tenantId: staffAdvances.tenantId,
        staffId: staffAdvances.staffId,
        amount: staffAdvances.amount,
        currency: staffAdvances.currency,
        reason: staffAdvances.reason,
        requestedAt: staffAdvances.requestedAt,
        approvedBy: staffAdvances.approvedBy,
        installments: staffAdvances.installments,
        remaining: staffAdvances.remaining,
        status: staffAdvances.status,
        createdAt: staffAdvances.createdAt,
        position: staff.position,
        personName: persons.fullName,
      })
      .from(staffAdvances)
      .innerJoin(staff, eq(staffAdvances.staffId, staff.id))
      .innerJoin(persons, eq(staff.personId, persons.id))
      .where(and(eq(staff.condominiumId, condominiumId), eq(staffAdvances.tenantId, tenantId), isNull(staffAdvances.deletedAt)))
      .orderBy(desc(staffAdvances.requestedAt));
  }

  async update(id: string, tenantId: string, data: Partial<typeof staffAdvances.$inferInsert>) {
    const [updated] = await this.dbService.db
      .update(staffAdvances)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(staffAdvances.id, id), eq(staffAdvances.tenantId, tenantId), isNull(staffAdvances.deletedAt)))
      .returning();
    return updated || null;
  }
}
