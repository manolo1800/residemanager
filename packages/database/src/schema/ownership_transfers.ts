import { pgTable, uuid, varchar, text, timestamp, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { condominiums } from "./condominiums";
import { units } from "./units";
import { persons } from "./persons";
import { users } from "./users";

export const ownershipTransfers = pgTable(
  "ownership_transfers",
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
    fromPersonId: uuid("from_person_id")
      .notNull()
      .references(() => persons.id),
    toPersonId: uuid("to_person_id")
      .notNull()
      .references(() => persons.id),
    contractFileUrl: text("contract_file_url").notNull(),
    status: varchar("status", { length: 20 }).notNull().default("pending"), // 'pending' | 'approved' | 'rejected'
    approvedBy: uuid("approved_by").references(() => users.id),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_transfers_tenant").on(table.tenantId),
    index("idx_transfers_condo").on(table.condominiumId),
    index("idx_transfers_unit").on(table.unitId),
    index("idx_transfers_status").on(table.condominiumId, table.status),
  ]
);
