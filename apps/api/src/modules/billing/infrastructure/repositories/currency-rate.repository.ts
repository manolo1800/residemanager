import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../../../common/database/database.service";
import { currencyRates } from "@sgc/database";
import { and, eq, isNull, desc } from "drizzle-orm";

@Injectable()
export class CurrencyRateRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async create(data: typeof currencyRates.$inferInsert) {
    const [created] = await this.dbService.db.insert(currencyRates).values(data).returning();
    return created;
  }

  async listByCondominium(condominiumId: string, tenantId: string) {
    return this.dbService.db
      .select()
      .from(currencyRates)
      .where(
        and(
          eq(currencyRates.condominiumId, condominiumId),
          eq(currencyRates.tenantId, tenantId),
          isNull(currencyRates.deletedAt)
        )
      )
      .orderBy(desc(currencyRates.effectiveDate), desc(currencyRates.createdAt));
  }

  async findLatest(condominiumId: string, tenantId: string, fromCurrency: string, toCurrency: string) {
    const [rate] = await this.dbService.db
      .select()
      .from(currencyRates)
      .where(
        and(
          eq(currencyRates.condominiumId, condominiumId),
          eq(currencyRates.tenantId, tenantId),
          eq(currencyRates.fromCurrency, fromCurrency),
          eq(currencyRates.toCurrency, toCurrency),
          isNull(currencyRates.deletedAt)
        )
      )
      .orderBy(desc(currencyRates.effectiveDate), desc(currencyRates.createdAt));
    return rate || null;
  }
}
