import { pgTable, uuid, varchar, numeric, date, timestamp, index, unique } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { condominiums } from "./condominiums";
import { units } from "./units";
import { feePlans } from "./fee_plans";

export const unitCharges = pgTable(
  "unit_charges",
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
    feePlanId: uuid("fee_plan_id")
      .notNull()
      .references(() => feePlans.id),
    period: varchar("period", { length: 7 }).notNull(), // 'YYYY-MM'
    amountBase: numeric("amount_base", { precision: 14, scale: 2 }).notNull(),
    taxAmount: numeric("tax_amount", { precision: 14, scale: 2 }).notNull().default("0"),
    moraAmount: numeric("mora_amount", { precision: 14, scale: 2 }).notNull().default("0"),
    totalAmount: numeric("total_amount", { precision: 14, scale: 2 }).notNull(),
    paidAmount: numeric("paid_amount", { precision: 14, scale: 2 }).notNull().default("0"),
    currency: varchar("currency", { length: 10 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("pending"), // 'pending' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled'
    dueDate: date("due_date").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    unique("uq_unit_charges_unit_plan_period").on(table.unitId, table.feePlanId, table.period),
    index("idx_unit_charges_tenant").on(table.tenantId),
    index("idx_unit_charges_condo").on(table.condominiumId),
    index("idx_unit_charges_unit").on(table.unitId),
    index("idx_unit_charges_period").on(table.period),
    index("idx_unit_charges_status").on(table.status),
    index("idx_unit_charges_due_date").on(table.dueDate),
  ]
);
