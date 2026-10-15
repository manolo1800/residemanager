import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../../../common/database/database.service";
import { payrollItems, staff, persons } from "@sgc/database";
import { and, eq, isNull, desc } from "drizzle-orm";

@Injectable()
export class PayrollItemRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async create(data: typeof payrollItems.$inferInsert) {
    const [created] = await this.dbService.db
      .insert(payrollItems)
      .values(data)
      .returning();
    return created;
  }

  async findById(id: string, tenantId: string) {
    const [row] = await this.dbService.db
      .select({
        id: payrollItems.id,
        tenantId: payrollItems.tenantId,
        payrollPeriodId: payrollItems.payrollPeriodId,
        staffId: payrollItems.staffId,
        baseSalary: payrollItems.baseSalary,
        deductions: payrollItems.deductions,
        advancesDiscount: payrollItems.advancesDiscount,
        netAmount: payrollItems.netAmount,
        currency: payrollItems.currency,
        receiptPdfUrl: payrollItems.receiptPdfUrl,
        status: payrollItems.status,
        createdAt: payrollItems.createdAt,
        position: staff.position,
        contractType: staff.contractType,
        payFrequency: staff.payFrequency,
        bankName: staff.bankName,
        bankAccount: staff.bankAccount,
        personName: persons.fullName,
        personDocType: persons.documentType,
        personDocNumber: persons.documentNumber,
      })
      .from(payrollItems)
      .innerJoin(staff, eq(payrollItems.staffId, staff.id))
      .innerJoin(persons, eq(staff.personId, persons.id))
      .where(and(eq(payrollItems.id, id), eq(payrollItems.tenantId, tenantId), isNull(payrollItems.deletedAt)));
    return row || null;
  }

  async listByPeriod(payrollPeriodId: string, tenantId: string) {
    return this.dbService.db
      .select({
        id: payrollItems.id,
        tenantId: payrollItems.tenantId,
        payrollPeriodId: payrollItems.payrollPeriodId,
        staffId: payrollItems.staffId,
        baseSalary: payrollItems.baseSalary,
        deductions: payrollItems.deductions,
        advancesDiscount: payrollItems.advancesDiscount,
        netAmount: payrollItems.netAmount,
        currency: payrollItems.currency,
        receiptPdfUrl: payrollItems.receiptPdfUrl,
        status: payrollItems.status,
        createdAt: payrollItems.createdAt,
        position: staff.position,
        contractType: staff.contractType,
        payFrequency: staff.payFrequency,
        bankName: staff.bankName,
        bankAccount: staff.bankAccount,
        personName: persons.fullName,
        personDocType: persons.documentType,
        personDocNumber: persons.documentNumber,
      })
      .from(payrollItems)
      .innerJoin(staff, eq(payrollItems.staffId, staff.id))
      .innerJoin(persons, eq(staff.personId, persons.id))
      .where(and(eq(payrollItems.payrollPeriodId, payrollPeriodId), eq(payrollItems.tenantId, tenantId), isNull(payrollItems.deletedAt)))
      .orderBy(persons.fullName);
  }

  async update(id: string, tenantId: string, data: Partial<typeof payrollItems.$inferInsert>) {
    const [updated] = await this.dbService.db
      .update(payrollItems)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(payrollItems.id, id), eq(payrollItems.tenantId, tenantId), isNull(payrollItems.deletedAt)))
      .returning();
    return updated || null;
  }

  async deleteByPeriod(payrollPeriodId: string, tenantId: string) {
    return this.dbService.db
      .delete(payrollItems)
      .where(and(eq(payrollItems.payrollPeriodId, payrollPeriodId), eq(payrollItems.tenantId, tenantId)));
  }
}
