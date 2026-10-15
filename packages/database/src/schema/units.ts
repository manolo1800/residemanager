import { pgTable, uuid, varchar, integer, numeric, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { condominiums } from "./condominiums";
import { condoStructures } from "./structures";

export const units = pgTable(
  "units",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    condominiumId: uuid("condominium_id")
      .notNull()
      .references(() => condominiums.id),
    structureId: uuid("structure_id").references(() => condoStructures.id),
    code: varchar("code", { length: 50 }).notNull(),
    floor: integer("floor"),
    type: varchar("type", { length: 20 }).notNull(), // 'apartment' | 'house'
    areaM2: numeric("area_m2", { precision: 10, scale: 2 }),
    aliquotPct: numeric("aliquot_pct", { precision: 6, scale: 3 }),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_units_tenant").on(table.tenantId),
    index("idx_units_condo").on(table.condominiumId),
    index("idx_units_structure").on(table.structureId),
    index("idx_units_condo_code").on(table.condominiumId, table.code),
  ]
);
