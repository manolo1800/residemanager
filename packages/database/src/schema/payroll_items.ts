import { pgTable, uuid, text, varchar, numeric, timestamp, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { payrollPeriods } from "./payroll_periods";
import { staff } from "./staff";

export const payrollItems = pgTable(
  "payroll_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    payrollPeriodId: uuid("payroll_period_id")
      .notNull()
      .references(() => payrollPeriods.id),
    staffId: uuid("staff_id")
      .notNull()
      .references(() => staff.id),
    baseSalary: numeric("base_salary", { precision: 14, scale: 2 }).notNull(),
    deductions: numeric("deductions", { precision: 14, scale: 2 }).notNull().default("0"),
    advancesDiscount: numeric("advances_discount", { precision: 14, scale: 2 }).notNull().default("0"),
    netAmount: numeric("net_amount", { precision: 14, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 10 }).notNull().default("USD"),
    receiptPdfUrl: text("receipt_pdf_url"),
    status: varchar("status", { length: 20 }).notNull().default("pending"), // 'pending' | 'paid'
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_payroll_items_period").on(table.payrollPeriodId),
    index("idx_payroll_items_staff").on(table.staffId),
    index("idx_payroll_items_tenant").on(table.tenantId),
  ]
);
