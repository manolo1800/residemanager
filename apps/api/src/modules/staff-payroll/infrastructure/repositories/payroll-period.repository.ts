import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../../../common/database/database.service";
import { payrollPeriods } from "@sgc/database";
import { and, eq, isNull, desc } from "drizzle-orm";

@Injectable()
export class PayrollPeriodRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async create(data: typeof payrollPeriods.$inferInsert) {
    const [created] = await this.dbService.db
      .insert(payrollPeriods)
      .values(data)
      .returning();
    return created;
  }

  async findById(id: string, tenantId: string) {
    const [row] = await this.dbService.db
      .select()
      .from(payrollPeriods)
      .where(and(eq(payrollPeriods.id, id), eq(payrollPeriods.tenantId, tenantId), isNull(payrollPeriods.deletedAt)));
    return row || null;
  }

  async listByCondominium(condominiumId: string, tenantId: string) {
    return this.dbService.db
      .select()
      .from(payrollPeriods)
      .where(and(eq(payrollPeriods.condominiumId, condominiumId), eq(payrollPeriods.tenantId, tenantId), isNull(payrollPeriods.deletedAt)))
      .orderBy(desc(payrollPeriods.startDate));
  }

  async update(id: string, tenantId: string, data: Partial<typeof payrollPeriods.$inferInsert>) {
    const [updated] = await this.dbService.db
      .update(payrollPeriods)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(payrollPeriods.id, id), eq(payrollPeriods.tenantId, tenantId), isNull(payrollPeriods.deletedAt)))
      .returning();
    return updated || null;
  }
}
