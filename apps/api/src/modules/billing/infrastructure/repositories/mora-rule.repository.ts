import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../../../common/database/database.service";
import { moraRules } from "@sgc/database";
import { and, eq, isNull, desc } from "drizzle-orm";

@Injectable()
export class MoraRuleRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async create(data: typeof moraRules.$inferInsert) {
    const [created] = await this.dbService.db.insert(moraRules).values(data).returning();
    return created;
  }

  async findByCondominium(condominiumId: string, tenantId: string) {
    const [rule] = await this.dbService.db
      .select()
      .from(moraRules)
      .where(
        and(
          eq(moraRules.condominiumId, condominiumId),
          eq(moraRules.tenantId, tenantId),
          isNull(moraRules.deletedAt)
        )
      )
      .orderBy(desc(moraRules.createdAt));
    return rule || null;
  }

  async listByCondominium(condominiumId: string, tenantId: string) {
    return this.dbService.db
      .select()
      .from(moraRules)
      .where(
        and(
          eq(moraRules.condominiumId, condominiumId),
          eq(moraRules.tenantId, tenantId),
          isNull(moraRules.deletedAt)
        )
      )
      .orderBy(desc(moraRules.createdAt));
  }
}
