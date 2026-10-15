import { pgTable, uuid, text, varchar, numeric, integer, timestamp, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { staff } from "./staff";
import { users } from "./users";

export const staffAdvances = pgTable(
  "staff_advances",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    staffId: uuid("staff_id")
      .notNull()
      .references(() => staff.id),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 10 }).notNull().default("USD"),
    reason: text("reason"),
    requestedAt: timestamp("requested_at", { withTimezone: true }).defaultNow().notNull(),
    approvedBy: uuid("approved_by").references(() => users.id),
    installments: integer("installments").notNull().default(1),
    remaining: numeric("remaining", { precision: 14, scale: 2 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("pending"), // 'pending' | 'approved' | 'applied' | 'rejected'
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_staff_advances_staff").on(table.staffId),
    index("idx_staff_advances_status").on(table.status),
    index("idx_staff_advances_tenant").on(table.tenantId),
  ]
);
