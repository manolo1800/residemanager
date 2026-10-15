import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  plan: text("plan").notNull().default("mvp"),
  primaryLocale: varchar("primary_locale", { length: 5 }).notNull().default("es"),
  primaryTimezone: text("primary_timezone").notNull().default("America/Caracas"),
  dateFormat: text("date_format").notNull().default("DD/MM/YYYY"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});
