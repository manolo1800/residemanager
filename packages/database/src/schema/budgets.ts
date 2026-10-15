import { pgTable, uuid, text, varchar, numeric, timestamp, index, unique } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { condominiums } from "./condominiums";
import { expenseCategories } from "./expense_categories";

export const budgets = pgTable(
  "budgets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    condominiumId: uuid("condominium_id")
      .notNull()
      .references(() => condominiums.id),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => expenseCategories.id),
    period: varchar("period", { length: 7 }).notNull(), // 'YYYY-MM'
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 10 }).notNull().default("USD"),
    alertThresholdPct: numeric("alert_threshold_pct", { precision: 5, scale: 2 })
      .notNull()
      .default("80.00"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    unique("uq_budgets_condo_cat_period").on(table.condominiumId, table.categoryId, table.period),
    index("idx_budgets_condo_period").on(table.condominiumId, table.period),
    index("idx_budgets_tenant").on(table.tenantId),
  ]
);
