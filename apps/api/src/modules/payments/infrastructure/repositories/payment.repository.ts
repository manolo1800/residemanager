import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../../../common/database/database.service";
import {
  payments,
  paymentMethods,
  paymentReceipts,
  paymentAllocations,
  unitCharges,
  units,
  condoStructures,
  users,
} from "@sgc/database";
import { and, eq, isNull, desc, sql, inArray, or, ilike } from "drizzle-orm";

@Injectable()
export class PaymentRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async create(
    paymentData: typeof payments.$inferInsert,
    allocationsData: Array<{ unitChargeId: string; amountApplied: string; period: string }> = [],
    receiptData?: { fileUrl: string; fileType: string; fileName?: string }
  ) {
    return this.dbService.db.transaction(async (tx) => {
      // 1. Insert payment
      const [payment] = await tx.insert(payments).values(paymentData).returning();

      // 2. Insert allocations if any
      const createdAllocations: (typeof paymentAllocations.$inferSelect)[] = [];
      for (const alloc of allocationsData) {
        const [createdAlloc] = await tx
          .insert(paymentAllocations)
          .values({
            tenantId: paymentData.tenantId,
            paymentId: payment.id,
            unitChargeId: alloc.unitChargeId,
            amountApplied: alloc.amountApplied,
            period: alloc.period,
          })
          .returning();
        createdAllocations.push(createdAlloc);
      }

      // 3. Insert receipt if any
      let createdReceipt: typeof paymentReceipts.$inferSelect | null = null;
      if (receiptData && receiptData.fileUrl) {
        const [rcpt] = await tx
          .insert(paymentReceipts)
          .values({
            tenantId: paymentData.tenantId,
            paymentId: payment.id,
            fileUrl: receiptData.fileUrl,
            fileType: receiptData.fileType || "image/jpeg",
            fileName: receiptData.fileName || "comprobante_pago",
          })
          .returning();
        createdReceipt = rcpt;

        // update hasReceipt to true
        await tx
          .update(payments)
          .set({ hasReceipt: true })
          .where(eq(payments.id, payment.id));
        payment.hasReceipt = true;
      }

      // 4. If payment was created directly as 'approved', apply allocations to unit charges
      if (payment.status === "approved" && createdAllocations.length > 0) {
        await this.applyAllocationsToChargesTx(tx, payment.tenantId, createdAllocations);
      }

      return {
        payment,
        allocations: createdAllocations,
        receipt: createdReceipt,
      };
    });
  }

  async findById(id: string, tenantId: string) {
    const [row] = await this.dbService.db
      .select({
        payment: payments,
        methodName: paymentMethods.name,
        methodType: paymentMethods.type,
        methodDetails: paymentMethods.details,
        unitCode: units.code,
        structureId: units.structureId,
        structureName: condoStructures.name,
        registeredByEmail: users.email,
      })
      .from(payments)
      .leftJoin(paymentMethods, eq(payments.methodId, paymentMethods.id))
      .innerJoin(units, eq(payments.unitId, units.id))
      .leftJoin(condoStructures, eq(units.structureId, condoStructures.id))
      .leftJoin(users, eq(payments.registeredByUserId, users.id))
      .where(
        and(
          eq(payments.id, id),
          eq(payments.tenantId, tenantId),
          isNull(payments.deletedAt)
        )
      );

    if (!row) return null;

    // Fetch allocations
    const allocationsList = await this.dbService.db
      .select({
        allocation: paymentAllocations,
        chargeAmount: unitCharges.totalAmount,
        chargeCurrency: unitCharges.currency,
        chargeStatus: unitCharges.status,
      })
      .from(paymentAllocations)
      .leftJoin(unitCharges, eq(paymentAllocations.unitChargeId, unitCharges.id))
      .where(
        and(
          eq(paymentAllocations.paymentId, id),
          eq(paymentAllocations.tenantId, tenantId)
        )
      );

    // Fetch receipts
    const receiptsList = await this.dbService.db
      .select()
      .from(paymentReceipts)
      .where(
        and(
          eq(paymentReceipts.paymentId, id),
          eq(paymentReceipts.tenantId, tenantId)
        )
      );

    return {
      ...row.payment,
      methodName: row.methodName,
      methodType: row.methodType,
      methodDetails: row.methodDetails,
      unitCode: row.unitCode,
      structureId: row.structureId,
      structureName: row.structureName,
      registeredByEmail: row.registeredByEmail,
      allocations: allocationsList.map((a) => ({
        ...a.allocation,
        chargeTotalAmount: a.chargeAmount,
        chargeCurrency: a.chargeCurrency,
        chargeStatus: a.chargeStatus,
      })),
      receipts: receiptsList,
    };
  }

  async list(
    tenantId: string,
    filters: {
      condominiumId?: string;
      unitId?: string;
      residentUserId?: string;
      status?: string;
      pendingDataOnly?: boolean;
      search?: string;
    }
  ) {
    const conditions = [
      eq(payments.tenantId, tenantId),
      isNull(payments.deletedAt),
    ];

    if (filters.condominiumId) {
      conditions.push(eq(payments.condominiumId, filters.condominiumId));
    }
    if (filters.unitId) {
      conditions.push(eq(payments.unitId, filters.unitId));
    }
    if (filters.residentUserId) {
      conditions.push(
        or(
          eq(payments.residentUserId, filters.residentUserId),
          eq(payments.registeredByUserId, filters.residentUserId)
        )!
      );
    }
    if (filters.pendingDataOnly) {
      conditions.push(eq(payments.status, "approved_pending_data"));
    } else if (filters.status) {
      conditions.push(eq(payments.status, filters.status));
    }

    if (filters.search) {
      const q = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(payments.referenceNumber, q),
          ilike(units.code, q),
          ilike(payments.phoneFrom, q)
        )!
      );
    }

    const rows = await this.dbService.db
      .select({
        payment: payments,
        methodName: paymentMethods.name,
        methodType: paymentMethods.type,
        unitCode: units.code,
        structureName: condoStructures.name,
        registeredByEmail: users.email,
      })
      .from(payments)
      .leftJoin(paymentMethods, eq(payments.methodId, paymentMethods.id))
      .innerJoin(units, eq(payments.unitId, units.id))
      .leftJoin(condoStructures, eq(units.structureId, condoStructures.id))
      .leftJoin(users, eq(payments.registeredByUserId, users.id))
      .where(and(...conditions))
      .orderBy(desc(payments.paymentDate), desc(payments.createdAt));

    return rows.map((r) => ({
      ...r.payment,
      methodName: r.methodName,
      methodType: r.methodType,
      unitCode: r.unitCode,
      structureName: r.structureName,
      registeredByEmail: r.registeredByEmail,
    }));
  }

  async update(id: string, tenantId: string, data: Partial<typeof payments.$inferInsert>) {
    const [updated] = await this.dbService.db
      .update(payments)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(payments.id, id),
          eq(payments.tenantId, tenantId),
          isNull(payments.deletedAt)
        )
      )
      .returning();
    return updated || null;
  }

  async addReceipt(
    tenantId: string,
    paymentId: string,
    receiptData: { fileUrl: string; fileType: string; fileName?: string }
  ) {
    return this.dbService.db.transaction(async (tx) => {
      const [receipt] = await tx
        .insert(paymentReceipts)
        .values({
          tenantId,
          paymentId,
          fileUrl: receiptData.fileUrl,
          fileType: receiptData.fileType || "image/jpeg",
          fileName: receiptData.fileName || "comprobante_pago",
        })
        .returning();

      await tx
        .update(payments)
        .set({
          hasReceipt: true,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, paymentId));

      return receipt;
    });
  }

  async approvePayment(
    id: string,
    tenantId: string,
    reviewedBy: string,
    reviewNotes?: string
  ) {
    return this.dbService.db.transaction(async (tx) => {
      // 1. Get payment and allocations
      const [payment] = await tx
        .select()
        .from(payments)
        .where(
          and(
            eq(payments.id, id),
            eq(payments.tenantId, tenantId),
            isNull(payments.deletedAt)
          )
        );

      if (!payment) return null;

      const allocations = await tx
        .select()
        .from(paymentAllocations)
        .where(
          and(
            eq(paymentAllocations.paymentId, id),
            eq(paymentAllocations.tenantId, tenantId)
          )
        );

      // 2. Update payment status to 'approved'
      const [updatedPayment] = await tx
        .update(payments)
        .set({
          status: "approved",
          reviewedBy,
          reviewedAt: new Date(),
          reviewNotes: reviewNotes || payment.reviewNotes,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, id))
        .returning();

      // 3. Apply allocations to unit charges
      await this.applyAllocationsToChargesTx(tx, tenantId, allocations);

      return updatedPayment;
    });
  }

  async rejectPayment(
    id: string,
    tenantId: string,
    reviewedBy: string,
    reason: string,
    reviewNotes?: string
  ) {
    return this.dbService.db.transaction(async (tx) => {
      const [payment] = await tx
        .select()
        .from(payments)
        .where(
          and(
            eq(payments.id, id),
            eq(payments.tenantId, tenantId),
            isNull(payments.deletedAt)
          )
        );

      if (!payment) return null;

      // If it was already approved earlier, revert charges
      if (payment.status === "approved" || payment.status === "approved_pending_data") {
        const allocations = await tx
          .select()
          .from(paymentAllocations)
          .where(eq(paymentAllocations.paymentId, id));
        await this.revertAllocationsFromChargesTx(tx, tenantId, allocations);
      }

      const [updatedPayment] = await tx
        .update(payments)
        .set({
          status: "rejected",
          reviewedBy,
          reviewedAt: new Date(),
          pendingDataReason: reason,
          reviewNotes: reviewNotes || reason,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, id))
        .returning();

      return updatedPayment;
    });
  }

  private async applyAllocationsToChargesTx(
    tx: any,
    tenantId: string,
    allocations: (typeof paymentAllocations.$inferSelect)[]
  ) {
    for (const alloc of allocations) {
      const [charge] = await tx
        .select()
        .from(unitCharges)
        .where(
          and(
            eq(unitCharges.id, alloc.unitChargeId),
            eq(unitCharges.tenantId, tenantId),
            isNull(unitCharges.deletedAt)
          )
        );

      if (charge) {
        const currentPaid = parseFloat(charge.paidAmount || "0");
        const added = parseFloat(alloc.amountApplied || "0");
        const newPaid = currentPaid + added;
        const total = parseFloat(charge.totalAmount);

        let newStatus = charge.status;
        if (newPaid >= total) {
          newStatus = "paid";
        } else if (newPaid > 0) {
          newStatus = "partially_paid";
        }

        await tx
          .update(unitCharges)
          .set({
            paidAmount: newPaid.toFixed(2),
            status: newStatus,
            updatedAt: new Date(),
          })
          .where(eq(unitCharges.id, charge.id));
      }
    }
  }

  private async revertAllocationsFromChargesTx(
    tx: any,
    tenantId: string,
    allocations: (typeof paymentAllocations.$inferSelect)[]
  ) {
    for (const alloc of allocations) {
      const [charge] = await tx
        .select()
        .from(unitCharges)
        .where(
          and(
            eq(unitCharges.id, alloc.unitChargeId),
            eq(unitCharges.tenantId, tenantId),
            isNull(unitCharges.deletedAt)
          )
        );

      if (charge) {
        const currentPaid = parseFloat(charge.paidAmount || "0");
        const subtracted = parseFloat(alloc.amountApplied || "0");
        const newPaid = Math.max(0, currentPaid - subtracted);
        const total = parseFloat(charge.totalAmount);

        let newStatus = "pending";
        if (newPaid >= total) {
          newStatus = "paid";
        } else if (newPaid > 0) {
          newStatus = "partially_paid";
        }

        await tx
          .update(unitCharges)
          .set({
            paidAmount: newPaid.toFixed(2),
            status: newStatus,
            updatedAt: new Date(),
          })
          .where(eq(unitCharges.id, charge.id));
      }
    }
  }
}
