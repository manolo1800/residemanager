import { pgTable, uuid, varchar, text, timestamp, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";
import { condominiums } from "./condominiums";

export const residentLinkRequests = pgTable(
  "resident_link_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    condominiumId: uuid("condominium_id")
      .notNull()
      .references(() => condominiums.id),
    unitCode: varchar("unit_code", { length: 50 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("pending"), // 'pending' | 'approved' | 'rejected'
    requestedAt: timestamp("requested_at", { withTimezone: true }).defaultNow().notNull(),
    resolvedBy: uuid("resolved_by").references(() => users.id),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_link_reqs_tenant").on(table.tenantId),
    index("idx_link_reqs_condo").on(table.condominiumId),
    index("idx_link_reqs_user").on(table.userId),
    index("idx_link_reqs_status").on(table.condominiumId, table.status),
  ]
);
