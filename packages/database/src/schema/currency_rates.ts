import { pgTable, uuid, varchar, numeric, text, date, timestamp, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { condominiums } from "./condominiums";

export const currencyRates = pgTable(
  "currency_rates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    condominiumId: uuid("condominium_id")
      .notNull()
      .references(() => condominiums.id),
    fromCurrency: varchar("from_currency", { length: 10 }).notNull(),
    toCurrency: varchar("to_currency", { length: 10 }).notNull(),
    rate: numeric("rate", { precision: 18, scale: 6 }).notNull(),
    source: text("source"),
    effectiveDate: date("effective_date").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_currency_rates_tenant").on(table.tenantId),
    index("idx_currency_rates_condo").on(table.condominiumId),
    index("idx_currency_rates_currencies").on(table.condominiumId, table.fromCurrency, table.toCurrency),
  ]
);
