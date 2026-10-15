import { pgTable, uuid, text, varchar, numeric, boolean, date, timestamp, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { condominiums } from "./condominiums";
import { condoStructures } from "./structures";
import { units } from "./units";

export const feePlans = pgTable(
  "fee_plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    condominiumId: uuid("condominium_id")
      .notNull()
      .references(() => condominiums.id),
    name: text("name").notNull(),
    type: varchar("type", { length: 20 }).notNull(), // 'ordinary' | 'extraordinary'
    mode: varchar("mode", { length: 20 }).notNull().default("fixed"), // 'fixed' | 'variable'
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 10 }).notNull().default("USD"),
    appliesTo: varchar("applies_to", { length: 20 }).notNull().default("all"), // 'all' | 'structure' | 'unit'
    structureId: uuid("structure_id").references(() => condoStructures.id),
    unitId: uuid("unit_id").references(() => units.id),
    taxApplies: boolean("tax_applies").notNull().default(true),
    startDate: date("start_date").notNull(),
    endDate: date("end_date"),
    requiresMeeting: boolean("requires_meeting").notNull().default(false),
    minuteId: uuid("minute_id"),
    status: varchar("status", { length: 20 }).notNull().default("active"), // 'active' | 'cancelled'
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdBy: uuid("created_by"),
    updatedBy: uuid("updated_by"),
  },
  (table) => [
    index("idx_fee_plans_tenant").on(table.tenantId),
    index("idx_fee_plans_condo").on(table.condominiumId),
    index("idx_fee_plans_condo_status").on(table.condominiumId, table.status),
    index("idx_fee_plans_structure").on(table.structureId),
    index("idx_fee_plans_unit").on(table.unitId),
  ]
);
