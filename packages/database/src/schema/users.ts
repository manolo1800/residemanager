import { pgTable, uuid, varchar, text, boolean, timestamp, index } from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    phone: text("phone"),
    passwordHash: text("password_hash").notNull(),
    fullName: text("full_name").notNull(),
    locale: varchar("locale", { length: 5 }).notNull().default("es"),
    timezone: text("timezone").notNull().default("America/Caracas"),
    isSuperAdmin: boolean("is_super_admin").notNull().default(false),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_users_email").on(table.email),
  ]
);
