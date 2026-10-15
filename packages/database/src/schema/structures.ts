import { pgTable, uuid, varchar, integer, timestamp, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { condominiums } from "./condominiums";

export const condoStructures = pgTable(
  "condo_structures",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    condominiumId: uuid("condominium_id")
      .notNull()
      .references(() => condominiums.id),
    name: varchar("name", { length: 255 }).notNull(),
    kind: varchar("kind", { length: 20 }).notNull(), // 'building' | 'block' | 'stage'
    floors: integer("floors"),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_structures_tenant").on(table.tenantId),
    index("idx_structures_condo").on(table.condominiumId),
    index("idx_structures_condo_name").on(table.condominiumId, table.name),
  ]
);
