import { pgTable, uuid, text, varchar, numeric, date, timestamp, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { condominiums } from "./condominiums";
import { persons } from "./persons";
import { users } from "./users";

export const staff = pgTable(
  "staff",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    condominiumId: uuid("condominium_id")
      .notNull()
      .references(() => condominiums.id),
    personId: uuid("person_id")
      .notNull()
      .references(() => persons.id),
    position: text("position").notNull(),
    contractType: varchar("contract_type", { length: 30 }).notNull().default("individual"), // 'company' | 'cooperative' | 'individual'
    hireDate: date("hire_date").notNull(),
    salary: numeric("salary", { precision: 14, scale: 2 }).notNull(),
    salaryCurrency: varchar("salary_currency", { length: 10 }).notNull().default("USD"),
    payFrequency: varchar("pay_frequency", { length: 20 }).notNull().default("biweekly"), // 'weekly' | 'biweekly' | 'monthly'
    bankName: text("bank_name"),
    bankAccount: text("bank_account"),
    documentUrl: text("document_url"),
    status: varchar("status", { length: 20 }).notNull().default("active"), // 'active' | 'inactive' | 'terminated'
    notes: text("notes"),
    createdBy: uuid("created_by").references(() => users.id),
    updatedBy: uuid("updated_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_staff_condominium").on(table.condominiumId),
    index("idx_staff_tenant").on(table.tenantId),
    index("idx_staff_person").on(table.personId),
    index("idx_staff_status").on(table.status),
  ]
);
