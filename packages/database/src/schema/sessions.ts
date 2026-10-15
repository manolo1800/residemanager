import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import { tenants } from "./tenants";
import { condominiums } from "./condominiums";

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    activeCondominiumId: uuid("active_condominium_id").references(() => condominiums.id),
    refreshTokenHash: text("refresh_token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_sessions_user").on(table.userId),
    index("idx_sessions_refresh").on(table.refreshTokenHash),
  ]
);
