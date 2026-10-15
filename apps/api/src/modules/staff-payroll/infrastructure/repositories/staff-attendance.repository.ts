import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../../../common/database/database.service";
import { staffAttendance, staff, persons } from "@sgc/database";
import { and, eq, isNull, desc } from "drizzle-orm";

@Injectable()
export class StaffAttendanceRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async create(data: typeof staffAttendance.$inferInsert) {
    const [created] = await this.dbService.db
      .insert(staffAttendance)
      .values(data)
      .returning();
    return created;
  }

  async findByStaffAndDate(staffId: string, date: string, tenantId: string) {
    const [row] = await this.dbService.db
      .select()
      .from(staffAttendance)
      .where(
        and(
          eq(staffAttendance.staffId, staffId),
          eq(staffAttendance.date, date),
          eq(staffAttendance.tenantId, tenantId),
          isNull(staffAttendance.deletedAt)
        )
      );
    return row || null;
  }

  async findById(id: string, tenantId: string) {
    const [row] = await this.dbService.db
      .select()
      .from(staffAttendance)
      .where(and(eq(staffAttendance.id, id), eq(staffAttendance.tenantId, tenantId), isNull(staffAttendance.deletedAt)));
    return row || null;
  }

  async listByStaff(staffId: string, tenantId: string) {
    return this.dbService.db
      .select()
      .from(staffAttendance)
      .where(and(eq(staffAttendance.staffId, staffId), eq(staffAttendance.tenantId, tenantId), isNull(staffAttendance.deletedAt)))
      .orderBy(desc(staffAttendance.date));
  }

  async listByCondominiumAndDate(condominiumId: string, date: string, tenantId: string) {
    return this.dbService.db
      .select({
        id: staffAttendance.id,
        tenantId: staffAttendance.tenantId,
        staffId: staffAttendance.staffId,
        date: staffAttendance.date,
        checkIn: staffAttendance.checkIn,
        checkOut: staffAttendance.checkOut,
        status: staffAttendance.status,
        notes: staffAttendance.notes,
        createdAt: staffAttendance.createdAt,
        staffPosition: staff.position,
        personName: persons.fullName,
      })
      .from(staffAttendance)
      .innerJoin(staff, eq(staffAttendance.staffId, staff.id))
      .innerJoin(persons, eq(staff.personId, persons.id))
      .where(
        and(
          eq(staff.condominiumId, condominiumId),
          eq(staffAttendance.date, date),
          eq(staffAttendance.tenantId, tenantId),
          isNull(staffAttendance.deletedAt)
        )
      )
      .orderBy(staff.position);
  }

  async update(id: string, tenantId: string, data: Partial<typeof staffAttendance.$inferInsert>) {
    const [updated] = await this.dbService.db
      .update(staffAttendance)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(staffAttendance.id, id), eq(staffAttendance.tenantId, tenantId), isNull(staffAttendance.deletedAt)))
      .returning();
    return updated || null;
  }
}
