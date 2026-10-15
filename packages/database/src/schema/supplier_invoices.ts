import { pgTable, uuid, text, varchar, numeric, date, timestamp, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { condominiums } from "./condominiums";
import { suppliers } from "./suppliers";
import { expenseCategories } from "./expense_categories";

export const supplierInvoices = pgTable(
  "supplier_invoices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    condominiumId: uuid("condominium_id")
      .notNull()
      .references(() => condominiums.id),
    supplierId: uuid("supplier_id")
      .notNull()
      .references(() => suppliers.id),
    categoryId: uuid("category_id")
      .references(() => expenseCategories.id),
    invoiceNumber: text("invoice_number").notNull(),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    paidAmount: numeric("paid_amount", { precision: 14, scale: 2 }).notNull().default("0.00"),
    currency: varchar("currency", { length: 10 }).notNull().default("USD"),
    issueDate: date("issue_date").notNull(),
    dueDate: date("due_date"),
    status: varchar("status", { length: 30 }).notNull().default("pending"), // 'pending' | 'partially_paid' | 'paid' | 'overdue'
    notes: text("notes"),
    receiptUrl: text("receipt_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_supplier_invoices_condo").on(table.condominiumId),
    index("idx_supplier_invoices_supplier").on(table.supplierId),
    index("idx_supplier_invoices_due_date").on(table.dueDate),
    index("idx_supplier_invoices_tenant").on(table.tenantId),
  ]
);
