import { pgTable, uuid, text, varchar, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { payments } from "./payments";

export const paymentReceipts = pgTable(
  "payment_receipts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    paymentId: uuid("payment_id")
      .notNull()
      .references(() => payments.id),
    fileUrl: text("file_url").notNull(),
    fileType: varchar("file_type", { length: 50 }).notNull(),
    fileName: varchar("file_name", { length: 255 }),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull(),
    ocrData: jsonb("ocr_data"),
  },
  (table) => [
    index("idx_payment_receipts_tenant").on(table.tenantId),
    index("idx_payment_receipts_payment").on(table.paymentId),
  ]
);
