import { pgTable, uuid, text, varchar, timestamp, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

export const contractTemplates = pgTable(
  "contract_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    name: text("name").notNull(),
    contractType: varchar("contract_type", { length: 30 }).notNull(), // 'company' | 'cooperative' | 'individual'
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_contract_templates_tenant").on(table.tenantId),
    index("idx_contract_templates_type").on(table.contractType),
  ]
);
