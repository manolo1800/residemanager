import { pgTable, uuid, text, integer, timestamp, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { condominiums } from "./condominiums";

export const suppliers = pgTable(
  "suppliers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    condominiumId: uuid("condominium_id")
      .notNull()
      .references(() => condominiums.id),
    name: text("name").notNull(),
    taxId: text("tax_id"),
    contact: text("contact"),
    email: text("email"),
    phone: text("phone"),
    address: text("address"),
    creditDays: integer("credit_days").notNull().default(0),
    category: text("category"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_suppliers_condo").on(table.condominiumId),
    index("idx_suppliers_tenant").on(table.tenantId),
  ]
);
