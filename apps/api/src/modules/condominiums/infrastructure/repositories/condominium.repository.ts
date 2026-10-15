import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../../../common/database/database.service";
import { condominiums, userCondominiumAccess, roles } from "@sgc/database";
import { eq, and, isNull, or, ilike } from "drizzle-orm";

@Injectable()
export class CondominiumRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async assignUserAccess(userId: string, condominiumId: string, roleCode = "condo_admin") {
    const [targetRole] = await this.dbService.db
      .select()
      .from(roles)
      .where(eq(roles.code, roleCode));

    if (targetRole) {
      await this.dbService.db
        .insert(userCondominiumAccess)
        .values({
          userId,
          condominiumId,
          roleId: targetRole.id,
          status: "active",
        });
    }
  }

  async findById(id: string, tenantId: string) {
    const results = await this.dbService.db
      .select()
      .from(condominiums)
      .where(
        and(
          eq(condominiums.id, id),
          eq(condominiums.tenantId, tenantId),
          isNull(condominiums.deletedAt)
        )
      );
    return results[0] || null;
  }

  async findByCode(code: string, tenantId: string) {
    const results = await this.dbService.db
      .select()
      .from(condominiums)
      .where(
        and(
          eq(condominiums.code, code.toUpperCase().trim()),
          eq(condominiums.tenantId, tenantId),
          isNull(condominiums.deletedAt)
        )
      );
    return results[0] || null;
  }

  async findAllForTenant(tenantId: string) {
    return this.dbService.db
      .select()
      .from(condominiums)
      .where(
        and(
          eq(condominiums.tenantId, tenantId),
          isNull(condominiums.deletedAt)
        )
      );
  }

  async search(query: string, tenantId: string) {
    const cleanQuery = `%${query.trim()}%`;
    return this.dbService.db
      .select()
      .from(condominiums)
      .where(
        and(
          eq(condominiums.tenantId, tenantId),
          isNull(condominiums.deletedAt),
          or(
            ilike(condominiums.name, cleanQuery),
            ilike(condominiums.code, cleanQuery),
            ilike(condominiums.address, cleanQuery)
          )
        )
      );
  }

  async searchPublic(query: string) {
    const cleanQuery = `%${(query || "").trim()}%`;
    return this.dbService.db
      .select({
        id: condominiums.id,
        tenantId: condominiums.tenantId,
        code: condominiums.code,
        name: condominiums.name,
        type: condominiums.type,
        address: condominiums.address,
        country: condominiums.country,
      })
      .from(condominiums)
      .where(
        and(
          isNull(condominiums.deletedAt),
          or(
            ilike(condominiums.name, cleanQuery),
            ilike(condominiums.code, cleanQuery),
            ilike(condominiums.address, cleanQuery)
          )
        )
      )
      .limit(30);
  }

  async create(data: typeof condominiums.$inferInsert) {
    const [inserted] = await this.dbService.db
      .insert(condominiums)
      .values(data)
      .returning();
    return inserted;
  }

  async update(id: string, tenantId: string, data: Partial<typeof condominiums.$inferInsert>) {
    const [updated] = await this.dbService.db
      .update(condominiums)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(condominiums.id, id),
          eq(condominiums.tenantId, tenantId),
          isNull(condominiums.deletedAt)
        )
      )
      .returning();
    return updated;
  }

  async softDelete(id: string, tenantId: string) {
    const [deleted] = await this.dbService.db
      .update(condominiums)
      .set({ deletedAt: new Date(), updatedAt: new Date(), status: "inactive" })
      .where(
        and(
          eq(condominiums.id, id),
          eq(condominiums.tenantId, tenantId),
          isNull(condominiums.deletedAt)
        )
      )
      .returning();
    return deleted;
  }

  async hasUserAccess(userId: string, condominiumId: string): Promise<boolean> {
    const results = await this.dbService.db
      .select()
      .from(userCondominiumAccess)
      .where(
        and(
          eq(userCondominiumAccess.userId, userId),
          eq(userCondominiumAccess.condominiumId, condominiumId),
          eq(userCondominiumAccess.status, "active"),
          isNull(userCondominiumAccess.deletedAt)
        )
      );
    return results.length > 0;
  }
}
