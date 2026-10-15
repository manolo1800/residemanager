import { pgTable, uuid, text, varchar, numeric, date, timestamp, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { condominiums } from "./condominiums";
import { supplierInvoices } from "./supplier_invoices";
import { users } from "./users";

export const supplierPayments = pgTable(
  "supplier_payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    condominiumId: uuid("condominium_id")
      .notNull()
      .references(() => condominiums.id),
    supplierInvoiceId: uuid("supplier_invoice_id")
      .notNull()
      .references(() => supplierInvoices.id),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 10 }).notNull().default("USD"),
    paymentDate: date("payment_date").notNull(),
    method: text("method"),
    reference: text("reference"),
    receiptUrl: text("receipt_url"),
    notes: text("notes"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_supplier_payments_condo").on(table.condominiumId),
    index("idx_supplier_payments_invoice").on(table.supplierInvoiceId),
    index("idx_supplier_payments_tenant").on(table.tenantId),
  ]
);
