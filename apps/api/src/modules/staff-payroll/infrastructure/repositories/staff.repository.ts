import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../../../common/database/database.service";
import { staff, persons } from "@sgc/database";
import { and, eq, isNull, desc } from "drizzle-orm";

@Injectable()
export class StaffRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async create(data: typeof staff.$inferInsert) {
    const [created] = await this.dbService.db
      .insert(staff)
      .values(data)
      .returning();
    return created;
  }

  async findById(id: string, tenantId: string) {
    const [row] = await this.dbService.db
      .select({
        id: staff.id,
        tenantId: staff.tenantId,
        condominiumId: staff.condominiumId,
        personId: staff.personId,
        position: staff.position,
        contractType: staff.contractType,
        hireDate: staff.hireDate,
        salary: staff.salary,
        salaryCurrency: staff.salaryCurrency,
        payFrequency: staff.payFrequency,
        bankName: staff.bankName,
        bankAccount: staff.bankAccount,
        documentUrl: staff.documentUrl,
        status: staff.status,
        notes: staff.notes,
        createdBy: staff.createdBy,
        updatedBy: staff.updatedBy,
        createdAt: staff.createdAt,
        updatedAt: staff.updatedAt,
        personName: persons.fullName,
        personDocType: persons.documentType,
        personDocNumber: persons.documentNumber,
        personEmail: persons.email,
        personPhone: persons.phone,
      })
      .from(staff)
      .innerJoin(persons, eq(staff.personId, persons.id))
      .where(and(eq(staff.id, id), eq(staff.tenantId, tenantId), isNull(staff.deletedAt)));

    return row || null;
  }

  async listByCondominium(condominiumId: string, tenantId: string) {
    return this.dbService.db
      .select({
        id: staff.id,
        tenantId: staff.tenantId,
        condominiumId: staff.condominiumId,
        personId: staff.personId,
        position: staff.position,
        contractType: staff.contractType,
        hireDate: staff.hireDate,
        salary: staff.salary,
        salaryCurrency: staff.salaryCurrency,
        payFrequency: staff.payFrequency,
        bankName: staff.bankName,
        bankAccount: staff.bankAccount,
        documentUrl: staff.documentUrl,
        status: staff.status,
        notes: staff.notes,
        createdAt: staff.createdAt,
        updatedAt: staff.updatedAt,
        personName: persons.fullName,
        personDocType: persons.documentType,
        personDocNumber: persons.documentNumber,
        personEmail: persons.email,
        personPhone: persons.phone,
      })
      .from(staff)
      .innerJoin(persons, eq(staff.personId, persons.id))
      .where(and(eq(staff.condominiumId, condominiumId), eq(staff.tenantId, tenantId), isNull(staff.deletedAt)))
      .orderBy(desc(staff.createdAt));
  }

  async update(id: string, tenantId: string, data: Partial<typeof staff.$inferInsert>) {
    const [updated] = await this.dbService.db
      .update(staff)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(staff.id, id), eq(staff.tenantId, tenantId), isNull(staff.deletedAt)))
      .returning();
    return updated || null;
  }

  async softDelete(id: string, tenantId: string) {
    const [deleted] = await this.dbService.db
      .update(staff)
      .set({ deletedAt: new Date(), status: "terminated", updatedAt: new Date() })
      .where(and(eq(staff.id, id), eq(staff.tenantId, tenantId)))
      .returning();
    return deleted || null;
  }
}
