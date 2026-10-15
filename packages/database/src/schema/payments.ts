import { pgTable, uuid, varchar, numeric, boolean, date, timestamp, text, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { condominiums } from "./condominiums";
import { units } from "./units";
import { users } from "./users";
import { paymentMethods } from "./payment_methods";

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    condominiumId: uuid("condominium_id")
      .notNull()
      .references(() => condominiums.id),
    unitId: uuid("unit_id")
      .notNull()
      .references(() => units.id),
    residentUserId: uuid("resident_user_id").references(() => users.id),
    origin: varchar("origin", { length: 20 }).notNull().default("resident"), // 'resident' | 'admin'
    registeredByUserId: uuid("registered_by_user_id")
      .notNull()
      .references(() => users.id),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 10 }).notNull().default("USD"),
    exchangeRate: numeric("exchange_rate", { precision: 18, scale: 6 }),
    amountBaseCurrency: numeric("amount_base_currency", { precision: 14, scale: 2 }),
    methodId: uuid("method_id").references(() => paymentMethods.id),
    referenceNumber: varchar("reference_number", { length: 100 }),
    paymentDate: date("payment_date").notNull(),
    phoneFrom: varchar("phone_from", { length: 50 }),
    status: varchar("status", { length: 30 }).notNull().default("pending"), // 'pending' | 'in_review' | 'approved' | 'approved_pending_data' | 'rejected' | 'cancelled'
    hasReceipt: boolean("has_receipt").notNull().default(false),
    hasReference: boolean("has_reference").notNull().default(false),
    pendingDataReason: text("pending_data_reason"),
    reviewedBy: uuid("reviewed_by").references(() => users.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewNotes: text("review_notes"),
    isPartial: boolean("is_partial").notNull().default(false),
    remainingAmount: numeric("remaining_amount", { precision: 14, scale: 2 }),
    dueDate: date("due_date"),
    receiptPdfUrl: text("receipt_pdf_url"),
    dataCompletedAt: timestamp("data_completed_at", { withTimezone: true }),
    dataCompletedBy: uuid("data_completed_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdBy: uuid("created_by").references(() => users.id),
    updatedBy: uuid("updated_by").references(() => users.id),
  },
  (table) => [
    index("idx_payments_tenant").on(table.tenantId),
    index("idx_payments_condo").on(table.condominiumId),
    index("idx_payments_unit").on(table.unitId),
    index("idx_payments_status").on(table.status),
    index("idx_payments_origin").on(table.origin),
    index("idx_payments_pending_data").on(table.tenantId, table.condominiumId, table.status),
  ]
);
