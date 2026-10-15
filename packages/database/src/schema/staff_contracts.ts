import { pgTable, uuid, text, varchar, date, timestamp, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { staff } from "./staff";
import { contractTemplates } from "./contract_templates";

export const staffContracts = pgTable(
  "staff_contracts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    staffId: uuid("staff_id")
      .notNull()
      .references(() => staff.id),
    templateId: uuid("template_id").references(() => contractTemplates.id),
    generatedPdfUrl: text("generated_pdf_url").notNull(),
    signedAt: timestamp("signed_at", { withTimezone: true }),
    validFrom: date("valid_from").notNull(),
    validTo: date("valid_to"),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_staff_contracts_staff").on(table.staffId),
    index("idx_staff_contracts_tenant").on(table.tenantId),
  ]
);
