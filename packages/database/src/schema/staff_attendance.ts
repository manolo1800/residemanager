import { pgTable, uuid, text, varchar, date, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { staff } from "./staff";

export const staffAttendance = pgTable(
  "staff_attendance",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    staffId: uuid("staff_id")
      .notNull()
      .references(() => staff.id),
    date: date("date").notNull(),
    checkIn: timestamp("check_in", { withTimezone: true }),
    checkOut: timestamp("check_out", { withTimezone: true }),
    status: varchar("status", { length: 20 }).notNull().default("present"), // 'present' | 'absent' | 'late' | 'justified'
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("uq_staff_attendance_date").on(table.staffId, table.date),
    index("idx_staff_attendance_date").on(table.date),
    index("idx_staff_attendance_tenant").on(table.tenantId),
  ]
);
