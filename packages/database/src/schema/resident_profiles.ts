import { pgTable, uuid, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";
import { persons } from "./persons";

export const residentProfiles = pgTable(
  "resident_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    personId: uuid("person_id")
      .notNull()
      .references(() => persons.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_resident_profiles_tenant").on(table.tenantId),
    index("idx_resident_profiles_user").on(table.userId),
    index("idx_resident_profiles_person").on(table.personId),
    uniqueIndex("uq_resident_profiles_user_person").on(table.userId, table.personId),
  ]
);
