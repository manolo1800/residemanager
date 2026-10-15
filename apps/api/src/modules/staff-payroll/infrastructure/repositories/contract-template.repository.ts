import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../../../common/database/database.service";
import { contractTemplates } from "@sgc/database";
import { and, eq, isNull, desc } from "drizzle-orm";

@Injectable()
export class ContractTemplateRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async create(data: typeof contractTemplates.$inferInsert) {
    const [created] = await this.dbService.db
      .insert(contractTemplates)
      .values(data)
      .returning();
    return created;
  }

  async findById(id: string, tenantId: string) {
    const [row] = await this.dbService.db
      .select()
      .from(contractTemplates)
      .where(and(eq(contractTemplates.id, id), eq(contractTemplates.tenantId, tenantId), isNull(contractTemplates.deletedAt)));
    return row || null;
  }

  async findByType(contractType: string, tenantId: string) {
    const [row] = await this.dbService.db
      .select()
      .from(contractTemplates)
      .where(
        and(
          eq(contractTemplates.contractType, contractType),
          eq(contractTemplates.tenantId, tenantId),
          isNull(contractTemplates.deletedAt)
        )
      )
      .orderBy(desc(contractTemplates.createdAt));
    return row || null;
  }

  async list(tenantId: string) {
    return this.dbService.db
      .select()
      .from(contractTemplates)
      .where(and(eq(contractTemplates.tenantId, tenantId), isNull(contractTemplates.deletedAt)))
      .orderBy(desc(contractTemplates.createdAt));
  }

  async update(id: string, tenantId: string, data: Partial<typeof contractTemplates.$inferInsert>) {
    const [updated] = await this.dbService.db
      .update(contractTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(contractTemplates.id, id), eq(contractTemplates.tenantId, tenantId), isNull(contractTemplates.deletedAt)))
      .returning();
    return updated || null;
  }
}
