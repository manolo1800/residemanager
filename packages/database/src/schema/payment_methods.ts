import { pgTable, uuid, varchar, boolean, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { condominiums } from "./condominiums";

export const paymentMethods = pgTable(
  "payment_methods",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    condominiumId: uuid("condominium_id")
      .notNull()
      .references(() => condominiums.id),
    name: varchar("name", { length: 100 }).notNull(),
    type: varchar("type", { length: 30 }).notNull(), // 'transfer' | 'mobile_payment' | 'cash' | 'check' | 'other'
    details: jsonb("details"), // { bankName, accountNumber, holderName, holderId, phone, email, notes }
    requiresReference: boolean("requires_reference").notNull().default(true),
    requiresPhone: boolean("requires_phone").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_payment_methods_tenant").on(table.tenantId),
    index("idx_payment_methods_condo").on(table.condominiumId),
    index("idx_payment_methods_active").on(table.isActive),
  ]
);
