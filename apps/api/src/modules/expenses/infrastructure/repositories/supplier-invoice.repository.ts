import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../../../common/database/database.service";
import { supplierInvoices, suppliers, expenseCategories } from "@sgc/database";
import { and, eq, isNull, desc, sql } from "drizzle-orm";

@Injectable()
export class SupplierInvoiceRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async create(data: typeof supplierInvoices.$inferInsert) {
    const [created] = await this.dbService.db
      .insert(supplierInvoices)
      .values(data)
      .returning();
    return created;
  }

  async findById(id: string, tenantId: string) {
    const [invoice] = await this.dbService.db
      .select({
        id: supplierInvoices.id,
        tenantId: supplierInvoices.tenantId,
        condominiumId: supplierInvoices.condominiumId,
        supplierId: supplierInvoices.supplierId,
        supplierName: suppliers.name,
        supplierTaxId: suppliers.taxId,
        categoryId: supplierInvoices.categoryId,
        categoryName: expenseCategories.name,
        invoiceNumber: supplierInvoices.invoiceNumber,
        amount: supplierInvoices.amount,
        paidAmount: supplierInvoices.paidAmount,
        currency: supplierInvoices.currency,
        issueDate: supplierInvoices.issueDate,
        dueDate: supplierInvoices.dueDate,
        status: supplierInvoices.status,
        notes: supplierInvoices.notes,
        receiptUrl: supplierInvoices.receiptUrl,
        createdAt: supplierInvoices.createdAt,
        updatedAt: supplierInvoices.updatedAt,
      })
      .from(supplierInvoices)
      .innerJoin(suppliers, eq(supplierInvoices.supplierId, suppliers.id))
      .leftJoin(expenseCategories, eq(supplierInvoices.categoryId, expenseCategories.id))
      .where(
        and(
          eq(supplierInvoices.id, id),
          eq(supplierInvoices.tenantId, tenantId),
          isNull(supplierInvoices.deletedAt)
        )
      );
    return invoice || null;
  }

  async list(
    condominiumId: string,
    tenantId: string,
    filters?: {
      supplierId?: string;
      status?: string;
    }
  ) {
    const conditions = [
      eq(supplierInvoices.condominiumId, condominiumId),
      eq(supplierInvoices.tenantId, tenantId),
      isNull(supplierInvoices.deletedAt),
    ];

    if (filters?.supplierId) {
      conditions.push(eq(supplierInvoices.supplierId, filters.supplierId));
    }
    if (filters?.status) {
      conditions.push(eq(supplierInvoices.status, filters.status));
    }

    return this.dbService.db
      .select({
        id: supplierInvoices.id,
        tenantId: supplierInvoices.tenantId,
        condominiumId: supplierInvoices.condominiumId,
        supplierId: supplierInvoices.supplierId,
        supplierName: suppliers.name,
        supplierTaxId: suppliers.taxId,
        supplierContact: suppliers.contact,
        supplierPhone: suppliers.phone,
        categoryId: supplierInvoices.categoryId,
        categoryName: expenseCategories.name,
        invoiceNumber: supplierInvoices.invoiceNumber,
        amount: supplierInvoices.amount,
        paidAmount: supplierInvoices.paidAmount,
        currency: supplierInvoices.currency,
        issueDate: supplierInvoices.issueDate,
        dueDate: supplierInvoices.dueDate,
        status: supplierInvoices.status,
        notes: supplierInvoices.notes,
        receiptUrl: supplierInvoices.receiptUrl,
        createdAt: supplierInvoices.createdAt,
        updatedAt: supplierInvoices.updatedAt,
      })
      .from(supplierInvoices)
      .innerJoin(suppliers, eq(supplierInvoices.supplierId, suppliers.id))
      .leftJoin(expenseCategories, eq(supplierInvoices.categoryId, expenseCategories.id))
      .where(and(...conditions))
      .orderBy(desc(supplierInvoices.issueDate), desc(supplierInvoices.createdAt));
  }

  async update(id: string, tenantId: string, data: Partial<typeof supplierInvoices.$inferInsert>) {
    const [updated] = await this.dbService.db
      .update(supplierInvoices)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(supplierInvoices.id, id),
          eq(supplierInvoices.tenantId, tenantId),
          isNull(supplierInvoices.deletedAt)
        )
      )
      .returning();
    return updated || null;
  }

  async recordPayment(id: string, tenantId: string, paymentAmount: number) {
    const invoice = await this.findById(id, tenantId);
    if (!invoice) return null;

    const currentPaid = parseFloat(invoice.paidAmount || "0");
    const totalAmount = parseFloat(invoice.amount || "0");
    const newPaid = currentPaid + paymentAmount;
    
    let newStatus: string = invoice.status;
    if (newPaid >= totalAmount) {
      newStatus = "paid";
    } else if (newPaid > 0) {
      newStatus = "partially_paid";
    }

    return this.update(id, tenantId, {
      paidAmount: newPaid.toFixed(2),
      status: newStatus,
    });
  }
}
