import { pgTable, uuid, varchar, numeric, integer, timestamp, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { condominiums } from "./condominiums";

export const moraRules = pgTable(
  "mora_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    condominiumId: uuid("condominium_id")
      .notNull()
      .references(() => condominiums.id),
    type: varchar("type", { length: 20 }).notNull(), // 'fixed' | 'percentage'
    value: numeric("value", { precision: 12, scale: 2 }).notNull(),
    appliesAfterDays: integer("applies_after_days").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_mora_rules_tenant").on(table.tenantId),
    index("idx_mora_rules_condo").on(table.condominiumId),
  ]
);
