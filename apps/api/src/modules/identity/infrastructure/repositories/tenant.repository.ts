import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../../../common/database/database.service";
import { tenants } from "@sgc/database";
import { eq, and, isNull } from "drizzle-orm";

@Injectable()
export class TenantRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async findById(id: string) {
    const results = await this.dbService.db
      .select()
      .from(tenants)
      .where(and(eq(tenants.id, id), isNull(tenants.deletedAt)));
    return results[0] || null;
  }

  async findBySlug(slug: string) {
    const results = await this.dbService.db
      .select()
      .from(tenants)
      .where(and(eq(tenants.slug, slug), isNull(tenants.deletedAt)));
    return results[0] || null;
  }

  async findAll() {
    return this.dbService.db
      .select()
      .from(tenants)
      .where(isNull(tenants.deletedAt));
  }

  async create(data: {
    name: string;
    slug: string;
    primaryLocale?: string;
    primaryTimezone?: string;
    dateFormat?: string;
  }) {
    const [inserted] = await this.dbService.db
      .insert(tenants)
      .values({
        name: data.name,
        slug: data.slug,
        primaryLocale: data.primaryLocale || "es",
        primaryTimezone: data.primaryTimezone || "America/Caracas",
        dateFormat: data.dateFormat || "DD/MM/YYYY",
        status: "active",
      })
      .returning();
    return inserted;
  }

  async update(id: string, data: Partial<typeof tenants.$inferInsert>) {
    const [updated] = await this.dbService.db
      .update(tenants)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(tenants.id, id), isNull(tenants.deletedAt)))
      .returning();
    return updated;
  }
}
