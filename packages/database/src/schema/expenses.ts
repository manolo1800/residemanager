import { pgTable, uuid, text, varchar, numeric, boolean, date, timestamp, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { condominiums } from "./condominiums";
import { expenseCategories } from "./expense_categories";
import { suppliers } from "./suppliers";
import { users } from "./users";

export const expenses = pgTable(
  "expenses",
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
    supplierId: uuid("supplier_id")
      .references(() => suppliers.id),
    concept: text("concept").notNull(),
    description: text("description"),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 10 }).notNull().default("USD"),
    exchangeRate: numeric("exchange_rate", { precision: 18, scale: 6 }),
    amountBaseCurrency: numeric("amount_base_currency", { precision: 14, scale: 2 }),
    expenseDate: date("expense_date").notNull(),
    receiptUrl: text("receipt_url"),
    status: varchar("status", { length: 30 }).notNull().default("paid"), // 'pending' | 'paid' | 'rejected'
    isBankCommission: boolean("is_bank_commission").notNull().default(false),
    sourceBankMovementId: uuid("source_bank_movement_id"),
    paymentMethod: text("payment_method"),
    referenceNumber: text("reference_number"),
    createdBy: uuid("created_by").references(() => users.id),
    updatedBy: uuid("updated_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_expenses_condo_date").on(table.condominiumId, table.expenseDate),
    index("idx_expenses_category").on(table.categoryId),
    index("idx_expenses_supplier").on(table.supplierId),
    index("idx_expenses_tenant").on(table.tenantId),
  ]
);
