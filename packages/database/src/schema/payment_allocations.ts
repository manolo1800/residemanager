import { pgTable, uuid, numeric, varchar, timestamp, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { payments } from "./payments";
import { unitCharges } from "./unit_charges";

export const paymentAllocations = pgTable(
  "payment_allocations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    paymentId: uuid("payment_id")
      .notNull()
      .references(() => payments.id),
    unitChargeId: uuid("unit_charge_id")
      .notNull()
      .references(() => unitCharges.id),
    amountApplied: numeric("amount_applied", { precision: 14, scale: 2 }).notNull(),
    period: varchar("period", { length: 7 }).notNull(), // 'YYYY-MM'
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_payment_allocations_tenant").on(table.tenantId),
    index("idx_payment_allocations_payment").on(table.paymentId),
    index("idx_payment_allocations_charge").on(table.unitChargeId),
  ]
);
