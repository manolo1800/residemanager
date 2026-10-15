import { pgTable, uuid, varchar, text, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

export const persons = pgTable(
  "persons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    documentType: varchar("document_type", { length: 20 }).notNull(), // 'V', 'E', 'J', 'P', 'DNI', etc.
    documentNumber: varchar("document_number", { length: 50 }).notNull(),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 50 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_persons_tenant").on(table.tenantId),
    uniqueIndex("uq_persons_tenant_document").on(
      table.tenantId,
      table.documentType,
      table.documentNumber
    ),
    index("idx_persons_tenant_name").on(table.tenantId, table.fullName),
  ]
);
