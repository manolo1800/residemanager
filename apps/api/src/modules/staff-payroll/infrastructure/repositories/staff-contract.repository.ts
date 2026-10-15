import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../../../common/database/database.service";
import { staffContracts, contractTemplates, staff } from "@sgc/database";
import { and, eq, isNull, desc } from "drizzle-orm";

@Injectable()
export class StaffContractRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async create(data: typeof staffContracts.$inferInsert) {
    const [created] = await this.dbService.db
      .insert(staffContracts)
      .values(data)
      .returning();
    return created;
  }

  async listByStaff(staffId: string, tenantId: string) {
    return this.dbService.db
      .select({
        id: staffContracts.id,
        tenantId: staffContracts.tenantId,
        staffId: staffContracts.staffId,
        templateId: staffContracts.templateId,
        templateName: contractTemplates.name,
        generatedPdfUrl: staffContracts.generatedPdfUrl,
        signedAt: staffContracts.signedAt,
        validFrom: staffContracts.validFrom,
        validTo: staffContracts.validTo,
        status: staffContracts.status,
        createdAt: staffContracts.createdAt,
      })
      .from(staffContracts)
      .leftJoin(contractTemplates, eq(staffContracts.templateId, contractTemplates.id))
      .where(and(eq(staffContracts.staffId, staffId), eq(staffContracts.tenantId, tenantId), isNull(staffContracts.deletedAt)))
      .orderBy(desc(staffContracts.createdAt));
  }

  async findById(id: string, tenantId: string) {
    const [row] = await this.dbService.db
      .select({
        id: staffContracts.id,
        tenantId: staffContracts.tenantId,
        staffId: staffContracts.staffId,
        templateId: staffContracts.templateId,
        templateName: contractTemplates.name,
        generatedPdfUrl: staffContracts.generatedPdfUrl,
        signedAt: staffContracts.signedAt,
        validFrom: staffContracts.validFrom,
        validTo: staffContracts.validTo,
        status: staffContracts.status,
        createdAt: staffContracts.createdAt,
      })
      .from(staffContracts)
      .leftJoin(contractTemplates, eq(staffContracts.templateId, contractTemplates.id))
      .where(and(eq(staffContracts.id, id), eq(staffContracts.tenantId, tenantId), isNull(staffContracts.deletedAt)));
    return row || null;
  }
}
