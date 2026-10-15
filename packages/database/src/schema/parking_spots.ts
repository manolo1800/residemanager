import { pgTable, uuid, varchar, timestamp, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { condominiums } from "./condominiums";
import { units } from "./units";

export const parkingSpots = pgTable(
  "parking_spots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    condominiumId: uuid("condominium_id")
      .notNull()
      .references(() => condominiums.id),
    code: varchar("code", { length: 50 }).notNull(),
    type: varchar("type", { length: 20 }).notNull(), // 'resident' | 'visitor'
    assignedUnitId: uuid("assigned_unit_id").references(() => units.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_parking_spots_tenant").on(table.tenantId),
    index("idx_parking_spots_condo").on(table.condominiumId),
    index("idx_parking_spots_unit").on(table.assignedUnitId),
    index("idx_parking_spots_condo_code").on(table.condominiumId, table.code),
  ]
);
