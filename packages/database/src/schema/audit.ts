import { pgTable, uuid, varchar, jsonb, timestamp, index } from "drizzle-orm/pg-core";

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull(),
    condominiumId: uuid("condominium_id"),
    userId: uuid("user_id"),
    action: varchar("action", { length: 100 }).notNull(),
    entity: varchar("entity", { length: 100 }).notNull(),
    entityId: varchar("entity_id", { length: 100 }).notNull(),
    oldValues: jsonb("old_values"),
    newValues: jsonb("new_values"),
    ipAddress: varchar("ip_address", { length: 45 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_audit_logs_tenant").on(table.tenantId),
    index("idx_audit_logs_entity").on(table.tenantId, table.entity, table.entityId),
  ]
);
