import { pgTable, uuid, varchar, text, jsonb, timestamp, index, boolean, numeric } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

export const condominiums = pgTable(
  "condominiums",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    code: varchar("code", { length: 50 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    type: varchar("type", { length: 20 }).notNull().default("buildings"),
    address: text("address").notNull().default(""),
    country: varchar("country", { length: 2 }).notNull().default("VE"),
    timezone: varchar("timezone", { length: 50 }).notNull().default("America/Caracas"),
    dateFormat: varchar("date_format", { length: 20 }).notNull().default("DD/MM/YYYY"),
    baseCurrency: varchar("base_currency", { length: 10 }).notNull().default("USD"),
    foreignCurrency: varchar("foreign_currency", { length: 10 }),
    foreignCurrencyEnabled: boolean("foreign_currency_enabled").notNull().default(false),
    taxExempt: boolean("tax_exempt").notNull().default(false),
    taxRate: numeric("tax_rate", { precision: 5, scale: 2 }),
    taxIncludedInFee: boolean("tax_included_in_fee").notNull().default(true),
    ordinaryFeeMode: varchar("ordinary_fee_mode", { length: 20 }).notNull().default("fixed"),
    extraordinaryRequiresMeeting: boolean("extraordinary_requires_meeting").notNull().default(true),
    moraType: varchar("mora_type", { length: 20 }).notNull().default("percentage"),
    moraValue: numeric("mora_value", { precision: 12, scale: 2 }).notNull().default("0"),
    partialPaymentsEnabled: boolean("partial_payments_enabled").notNull().default(false),
    partialPaymentInterestEnabled: boolean("partial_payment_interest_enabled").notNull().default(false),
    termsOwnEnabled: boolean("terms_own_enabled").notNull().default(false),
    termsOwnContent: text("terms_own_content"),
    branding: jsonb("branding").$type<{
      primaryColor?: string;
      secondaryColor?: string;
      logoUrl?: string;
      faviconUrl?: string;
    }>(),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_condominiums_tenant").on(table.tenantId),
    index("idx_condominiums_code").on(table.tenantId, table.code),
    index("idx_condominiums_name").on(table.tenantId, table.name),
  ]
);

