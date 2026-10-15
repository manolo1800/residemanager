import { pgTable, uuid, varchar, date, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { condominiums } from "./condominiums";
import { units } from "./units";
import { persons } from "./persons";

export const unitOwnerships = pgTable(
  "unit_ownerships",
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
    personId: uuid("person_id")
      .notNull()
      .references(() => persons.id),
    startDate: date("start_date").notNull(),
    endDate: date("end_date"),
    status: varchar("status", { length: 20 }).notNull().default("active"), // 'active' | 'transferred' | 'inactive'
    isPrimaryResidence: boolean("is_primary_residence").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_unit_ownerships_tenant").on(table.tenantId),
    index("idx_unit_ownerships_condo").on(table.condominiumId),
    index("idx_unit_ownerships_unit").on(table.unitId),
    index("idx_unit_ownerships_person").on(table.personId),
    index("idx_unit_ownerships_unit_status").on(table.unitId, table.status),
  ]
);
