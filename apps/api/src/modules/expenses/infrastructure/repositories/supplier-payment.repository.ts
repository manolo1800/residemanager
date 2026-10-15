import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../../../common/database/database.service";
import { supplierPayments, supplierInvoices, suppliers } from "@sgc/database";
import { and, eq, isNull, desc } from "drizzle-orm";

@Injectable()
export class SupplierPaymentRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async create(data: typeof supplierPayments.$inferInsert) {
    const [created] = await this.dbService.db
      .insert(supplierPayments)
      .values(data)
      .returning();
    return created;
  }

  async listByInvoice(supplierInvoiceId: string, tenantId: string) {
    return this.dbService.db
      .select()
      .from(supplierPayments)
      .where(
        and(
          eq(supplierPayments.supplierInvoiceId, supplierInvoiceId),
          eq(supplierPayments.tenantId, tenantId),
          isNull(supplierPayments.deletedAt)
        )
      )
      .orderBy(desc(supplierPayments.paymentDate), desc(supplierPayments.createdAt));
  }

  async listByCondominium(condominiumId: string, tenantId: string) {
    return this.dbService.db
      .select({
        id: supplierPayments.id,
        tenantId: supplierPayments.tenantId,
        condominiumId: supplierPayments.condominiumId,
        supplierInvoiceId: supplierPayments.supplierInvoiceId,
        invoiceNumber: supplierInvoices.invoiceNumber,
        supplierName: suppliers.name,
        amount: supplierPayments.amount,
        currency: supplierPayments.currency,
        paymentDate: supplierPayments.paymentDate,
        method: supplierPayments.method,
        reference: supplierPayments.reference,
        receiptUrl: supplierPayments.receiptUrl,
        notes: supplierPayments.notes,
        createdAt: supplierPayments.createdAt,
      })
      .from(supplierPayments)
      .innerJoin(supplierInvoices, eq(supplierPayments.supplierInvoiceId, supplierInvoices.id))
      .innerJoin(suppliers, eq(supplierInvoices.supplierId, suppliers.id))
      .where(
        and(
          eq(supplierPayments.condominiumId, condominiumId),
          eq(supplierPayments.tenantId, tenantId),
          isNull(supplierPayments.deletedAt)
        )
      )
      .orderBy(desc(supplierPayments.paymentDate), desc(supplierPayments.createdAt));
  }
}
