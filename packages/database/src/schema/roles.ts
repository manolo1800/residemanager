import { pgTable, uuid, text, boolean, timestamp, unique, primaryKey, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";
import { condominiums } from "./condominiums";

export const roles = pgTable(
  "roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").references(() => tenants.id),
    name: text("name").notNull(),
    code: text("code").notNull(),
    description: text("description"),
    isSystem: boolean("is_system").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    unique("uq_roles_tenant_code").on(table.tenantId, table.code),
    index("idx_roles_tenant").on(table.tenantId),
  ]
);

export const permissions = pgTable(
  "permissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    module: text("module").notNull(),
    action: text("action").notNull(),
    description: text("description"),
  },
  (table) => [
    unique("uq_permissions_module_action").on(table.module, table.action),
  ]
);

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.roleId, table.permissionId] }),
  ]
);

export const userTenantRoles = pgTable(
  "user_tenant_roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_user_tenant_roles").on(table.userId, table.tenantId),
  ]
);

export const userCondominiumAccess = pgTable(
  "user_condominium_access",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    condominiumId: uuid("condominium_id")
      .notNull()
      .references(() => condominiums.id),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_user_condo_access").on(table.userId, table.condominiumId),
  ]
);
