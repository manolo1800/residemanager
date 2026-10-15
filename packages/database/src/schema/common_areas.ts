import { pgTable, uuid, varchar, integer, timestamp, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { condominiums } from "./condominiums";

export const commonAreas = pgTable(
  "common_areas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    condominiumId: uuid("condominium_id")
      .notNull()
      .references(() => condominiums.id),
    name: varchar("name", { length: 255 }).notNull(),
    type: varchar("type", { length: 30 }).notNull(), // 'park' | 'pool' | 'party_room' | 'gym' | 'other'
    capacity: integer("capacity"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_common_areas_tenant").on(table.tenantId),
    index("idx_common_areas_condo").on(table.condominiumId),
  ]
);
