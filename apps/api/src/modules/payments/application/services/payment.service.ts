import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PaymentRepository } from "../../infrastructure/repositories/payment.repository";
import { PaymentMethodRepository } from "../../infrastructure/repositories/payment-method.repository";
import { UnitChargeRepository } from "../../../billing/infrastructure/repositories/unit-charge.repository";
import { CondominiumsFacade } from "../../../condominiums/condominiums.facade";
import { PropertiesFacade } from "../../../properties/properties.facade";
import { RequestContextStore } from "../../../../common/context/request-context";
import {
  CreatePaymentMethodRequest,
  UpdatePaymentMethodRequest,
  CreatePaymentRequest,
  CreateAdminPaymentRequest,
  CompletePaymentDataRequest,
  ReviewPaymentRequest,
} from "@sgc/contracts";

// Idempotency cache in memory for double-submit prevention
const idempotencyStore = new Map<string, { timestamp: number; response: any }>();

@Injectable()
export class PaymentService {
  constructor(
    private readonly paymentRepo: PaymentRepository,
    private readonly paymentMethodRepo: PaymentMethodRepository,
    private readonly unitChargeRepo: UnitChargeRepository,
    private readonly condoFacade: CondominiumsFacade,
    private readonly propertiesFacade: PropertiesFacade
  ) {}

  // ================= 1. PAYMENT METHODS =================
  async listPaymentMethods(condominiumId: string, onlyActive = false) {
    const ctx = RequestContextStore.getOrThrow();
    return this.paymentMethodRepo.listByCondominium(condominiumId, ctx.tenantId, onlyActive);
  }

  async createPaymentMethod(dto: CreatePaymentMethodRequest) {
    const ctx = RequestContextStore.getOrThrow();
    const condo = await this.condoFacade.getCondominiumById(dto.condominiumId, ctx.tenantId);
    if (!condo) {
      throw new NotFoundException("Condominio no encontrado");
    }

    return this.paymentMethodRepo.create({
      tenantId: ctx.tenantId,
      condominiumId: dto.condominiumId,
      name: dto.name,
      type: dto.type,
      details: dto.details || {},
      requiresReference: dto.requiresReference ?? true,
      requiresPhone: dto.requiresPhone ?? false,
      isActive: dto.isActive ?? true,
    });
  }

  async updatePaymentMethod(id: string, dto: UpdatePaymentMethodRequest) {
    const ctx = RequestContextStore.getOrThrow();
    const existing = await this.paymentMethodRepo.findById(id, ctx.tenantId);
    if (!existing) {
      throw new NotFoundException("Medio de pago no encontrado");
    }

    return this.paymentMethodRepo.update(id, ctx.tenantId, {
      name: dto.name ?? existing.name,
      type: dto.type ?? existing.type,
      details: dto.details !== undefined ? dto.details : existing.details,
      requiresReference: dto.requiresReference ?? existing.requiresReference,
      requiresPhone: dto.requiresPhone ?? existing.requiresPhone,
      isActive: dto.isActive ?? existing.isActive,
    });
  }

  // ================= 2. PAYMENTS LIST & DETAILS =================
  async listPayments(
    condominiumId?: string,
    filters: {
      unitId?: string;
      residentUserId?: string;
      status?: string;
      pendingDataOnly?: boolean;
      search?: string;
    } = {}
  ) {
    const ctx = RequestContextStore.getOrThrow();
    const targetCondoId = condominiumId || ctx.activeCondominiumId || undefined;

    return this.paymentRepo.list(ctx.tenantId, {
      condominiumId: targetCondoId,
      ...filters,
    });
  }

  async getPendingDataPayments(condominiumId?: string) {
    const ctx = RequestContextStore.getOrThrow();
    const targetCondoId = condominiumId || ctx.activeCondominiumId || undefined;
    return this.paymentRepo.list(ctx.tenantId, {
      condominiumId: targetCondoId,
      pendingDataOnly: true,
    });
  }

  async getPaymentById(id: string) {
    const ctx = RequestContextStore.getOrThrow();
    const payment = await this.paymentRepo.findById(id, ctx.tenantId);
    if (!payment) {
      throw new NotFoundException("Pago no encontrado");
    }
    return payment;
  }

  // ================= 3. RESIDENT CREATE PAYMENT =================
  async createResidentPayment(dto: CreatePaymentRequest, idempotencyKey?: string) {
    const ctx = RequestContextStore.getOrThrow();

    // Idempotency check (BR-015)
    if (idempotencyKey) {
      const cached = idempotencyStore.get(idempotencyKey);
      if (cached && Date.now() - cached.timestamp < 1000 * 60 * 30) {
        return cached.response;
      }
    }

    // Verify unit exists
    const unit = await this.condoFacade.getUnitById(dto.unitId, dto.condominiumId, ctx.tenantId);
    if (!unit) {
      throw new NotFoundException("Unidad residencial no encontrada");
    }

    // Fetch and validate selected charges
    const unitChargesList = await this.unitChargeRepo.listByUnit(dto.unitId, ctx.tenantId);
    const selectedCharges = unitChargesList
      .map((r) => r.charge)
      .filter((c) => dto.chargeIds.includes(c.id));

    if (selectedCharges.length === 0) {
      throw new BadRequestException("Los cargos seleccionados no pertenecen a la unidad indicada");
    }

    // Prepare allocations: allocate total amount across the selected charges in order
    const totalPayment = parseFloat(dto.amount);
    let remainingToAllocate = totalPayment;
    const allocations: Array<{ unitChargeId: string; amountApplied: string; period: string }> = [];

    for (const charge of selectedCharges) {
      if (remainingToAllocate <= 0) break;
      const chargeTotal = parseFloat(charge.totalAmount);
      const chargePaid = parseFloat(charge.paidAmount || "0");
      const pendingChargeAmount = Math.max(0, chargeTotal - chargePaid);

      const applyAmount = Math.min(remainingToAllocate, pendingChargeAmount > 0 ? pendingChargeAmount : remainingToAllocate);
      allocations.push({
        unitChargeId: charge.id,
        amountApplied: applyAmount.toFixed(2),
        period: charge.period,
      });
      remainingToAllocate -= applyAmount;
    }

    // Verify method if provided
    let hasRef = Boolean(dto.referenceNumber && dto.referenceNumber.trim().length > 0);
    let hasReceipt = Boolean(dto.receiptFileUrl && dto.receiptFileUrl.trim().length > 0);

    const paymentRecord = await this.paymentRepo.create(
      {
        tenantId: ctx.tenantId,
        condominiumId: dto.condominiumId,
        unitId: dto.unitId,
        residentUserId: ctx.userId,
        origin: "resident",
        registeredByUserId: ctx.userId,
        amount: dto.amount,
        currency: dto.currency || "USD",
        exchangeRate: dto.exchangeRate ? String(dto.exchangeRate) : null,
        amountBaseCurrency: dto.amountBaseCurrency ? String(dto.amountBaseCurrency) : dto.amount,
        methodId: dto.methodId || null,
        referenceNumber: dto.referenceNumber || null,
        paymentDate: dto.paymentDate,
        phoneFrom: dto.phoneFrom || null,
        status: "pending",
        hasReceipt,
        hasReference: hasRef,
        isPartial: remainingToAllocate > 0,
        remainingAmount: remainingToAllocate > 0 ? remainingToAllocate.toFixed(2) : "0.00",
        createdBy: ctx.userId,
      },
      allocations,
      hasReceipt
        ? {
            fileUrl: dto.receiptFileUrl!,
            fileType: dto.receiptFileType || "image/jpeg",
            fileName: dto.receiptFileName || "comprobante_residente",
          }
        : undefined
    );

    const result = {
      message: "Pago registrado exitosamente. Está en proceso de revisión por la administración.",
      payment: paymentRecord.payment,
      allocations: paymentRecord.allocations,
    };

    if (idempotencyKey) {
      idempotencyStore.set(idempotencyKey, { timestamp: Date.now(), response: result });
    }

    return result;
  }

  // ================= 4. ADMIN ASSISTED PAYMENT =================
  async createAdminPayment(dto: CreateAdminPaymentRequest, idempotencyKey?: string) {
    const ctx = RequestContextStore.getOrThrow();

    if (idempotencyKey) {
      const cached = idempotencyStore.get(idempotencyKey);
      if (cached && Date.now() - cached.timestamp < 1000 * 60 * 30) {
        return cached.response;
      }
    }

    const unit = await this.condoFacade.getUnitById(dto.unitId, dto.condominiumId, ctx.tenantId);
    if (!unit) {
      throw new NotFoundException("Unidad residencial no encontrada");
    }

    // Determine initial status:
    // If admin explicitly checked `isApprovedPendingData` or if missing both ref and receipt:
    const hasRef = Boolean(dto.referenceNumber && dto.referenceNumber.trim().length > 0);
    const hasReceipt = Boolean(dto.receiptFileUrl && dto.receiptFileUrl.trim().length > 0);

    let status = "approved";
    let pendingReason: string | null = null;

    if (dto.isApprovedPendingData || (!hasRef && !hasReceipt)) {
      status = "approved_pending_data";
      pendingReason =
        dto.pendingDataReason ||
        "Pago registrado en taquilla/oficina pendiente por validar comprobante bancario o referencia.";
    }

    // Prepare allocations if charges were passed or auto-allocate from pending charges
    let chargeIds = dto.chargeIds || [];
    if (chargeIds.length === 0) {
      const unitChargesList = await this.unitChargeRepo.listByUnit(dto.unitId, ctx.tenantId);
      const pendingCharges = unitChargesList
        .map((r) => r.charge)
        .filter((c) => c.status === "pending" || c.status === "partially_paid" || c.status === "overdue");
      chargeIds = pendingCharges.map((c) => c.id);
    }

    const unitChargesList = await this.unitChargeRepo.listByUnit(dto.unitId, ctx.tenantId);
    const selectedCharges = unitChargesList
      .map((r) => r.charge)
      .filter((c) => chargeIds.includes(c.id));

    const totalPayment = parseFloat(dto.amount);
    let remainingToAllocate = totalPayment;
    const allocations: Array<{ unitChargeId: string; amountApplied: string; period: string }> = [];

    for (const charge of selectedCharges) {
      if (remainingToAllocate <= 0) break;
      const chargeTotal = parseFloat(charge.totalAmount);
      const chargePaid = parseFloat(charge.paidAmount || "0");
      const pendingChargeAmount = Math.max(0, chargeTotal - chargePaid);

      const applyAmount = Math.min(
        remainingToAllocate,
        pendingChargeAmount > 0 ? pendingChargeAmount : remainingToAllocate
      );
      allocations.push({
        unitChargeId: charge.id,
        amountApplied: applyAmount.toFixed(2),
        period: charge.period,
      });
      remainingToAllocate -= applyAmount;
    }

    const paymentRecord = await this.paymentRepo.create(
      {
        tenantId: ctx.tenantId,
        condominiumId: dto.condominiumId,
        unitId: dto.unitId,
        residentUserId: dto.residentUserId || null,
        origin: "admin",
        registeredByUserId: ctx.userId,
        amount: dto.amount,
        currency: dto.currency || "USD",
        exchangeRate: dto.exchangeRate ? String(dto.exchangeRate) : null,
        amountBaseCurrency: dto.amountBaseCurrency ? String(dto.amountBaseCurrency) : dto.amount,
        methodId: dto.methodId || null,
        referenceNumber: dto.referenceNumber || null,
        paymentDate: dto.paymentDate,
        phoneFrom: dto.phoneFrom || null,
        status,
        hasReceipt,
        hasReference: hasRef,
        pendingDataReason: pendingReason,
        reviewedBy: ctx.userId,
        reviewedAt: new Date(),
        reviewNotes: dto.reviewNotes || "Pago registrado y procesado por administración",
        isPartial: remainingToAllocate > 0,
        remainingAmount: remainingToAllocate > 0 ? remainingToAllocate.toFixed(2) : "0.00",
        createdBy: ctx.userId,
      },
      allocations,
      hasReceipt
        ? {
            fileUrl: dto.receiptFileUrl!,
            fileType: dto.receiptFileType || "image/jpeg",
            fileName: dto.receiptFileName || "comprobante_admin",
          }
        : undefined
    );

    const result = {
      message:
        status === "approved_pending_data"
          ? "Pago registrado con estado: Aprobado pendiente de datos"
          : "Pago registrado y aplicado a las cuotas exitosamente.",
      payment: paymentRecord.payment,
      allocations: paymentRecord.allocations,
    };

    if (idempotencyKey) {
      idempotencyStore.set(idempotencyKey, { timestamp: Date.now(), response: result });
    }

    return result;
  }

  // ================= 5. APPROVE / REJECT =================
  async approvePayment(id: string, reviewNotes?: string) {
    const ctx = RequestContextStore.getOrThrow();
    const existing = await this.paymentRepo.findById(id, ctx.tenantId);
    if (!existing) {
      throw new NotFoundException("Pago no encontrado");
    }

    if (existing.status === "approved") {
      throw new ConflictException("El pago ya ha sido aprobado previamente");
    }

    const updated = await this.paymentRepo.approvePayment(
      id,
      ctx.tenantId,
      ctx.userId,
      reviewNotes || "Pago aprobado por administración"
    );

    return {
      message: "Pago aprobado exitosamente. Se ha aplicado el abono a los cargos correspondientes.",
      payment: updated,
    };
  }

  async rejectPayment(id: string, reason: string, reviewNotes?: string) {
    const ctx = RequestContextStore.getOrThrow();
    const existing = await this.paymentRepo.findById(id, ctx.tenantId);
    if (!existing) {
      throw new NotFoundException("Pago no encontrado");
    }

    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException("Debe especificar un motivo de rechazo");
    }

    const updated = await this.paymentRepo.rejectPayment(
      id,
      ctx.tenantId,
      ctx.userId,
      reason,
      reviewNotes
    );

    return {
      message: "Pago rechazado. Los cargos mantienen su saldo pendiente.",
      payment: updated,
    };
  }

  // ================= 6. COMPLETE PENDING DATA =================
  async completePaymentData(id: string, dto: CompletePaymentDataRequest) {
    const ctx = RequestContextStore.getOrThrow();
    const existing = await this.paymentRepo.findById(id, ctx.tenantId);
    if (!existing) {
      throw new NotFoundException("Pago no encontrado");
    }

    if (existing.status === "approved") {
      throw new ConflictException("PAYMENT_ALREADY_COMPLETE: El pago ya cuenta con todos los datos y está aprobado.");
    }

    // Add receipt if provided
    if (dto.receiptFileUrl) {
      await this.paymentRepo.addReceipt(ctx.tenantId, id, {
        fileUrl: dto.receiptFileUrl,
        fileType: dto.receiptFileType || "image/jpeg",
        fileName: dto.receiptFileName || "comprobante_complementario",
      });
    }

    // Transition from approved_pending_data (or pending) to approved
    const updated = await this.paymentRepo.update(id, ctx.tenantId, {
      methodId: dto.methodId || existing.methodId,
      referenceNumber: dto.referenceNumber || existing.referenceNumber,
      phoneFrom: dto.phoneFrom || existing.phoneFrom,
      hasReference: Boolean(dto.referenceNumber || existing.referenceNumber),
      status: "approved",
      dataCompletedAt: new Date(),
      dataCompletedBy: ctx.userId,
      pendingDataReason: null,
      reviewNotes: dto.reviewNotes || existing.reviewNotes,
      updatedBy: ctx.userId,
    });

    return {
      message: "Datos de pago completados exitosamente. El pago ahora figura como Aprobado definitivo.",
      payment: updated,
    };
  }

  // ================= 7. RESIDENT PAYMENTS (MY PAYMENTS) =================
  async getMyPayments() {
    const ctx = RequestContextStore.getOrThrow();
    return this.paymentRepo.list(ctx.tenantId, {
      residentUserId: ctx.userId,
    });
  }

  // ================= 8. RECEIPT GENERATION =================
  async getPaymentReceiptData(id: string) {
    const ctx = RequestContextStore.getOrThrow();
    const payment = await this.paymentRepo.findById(id, ctx.tenantId);
    if (!payment) {
      throw new NotFoundException("Pago no encontrado");
    }

    const condo = await this.condoFacade.getCondominiumById(payment.condominiumId, ctx.tenantId);

    return {
      receiptNumber: `REC-${payment.id.substring(0, 8).toUpperCase()}`,
      issuedAt: new Date().toISOString(),
      condominium: {
        name: condo?.name || "Condominio Residencial",
        address: condo?.address || "",
        code: condo?.code || "CONDO",
        currency: condo?.baseCurrency || "USD",
      },
      payment: {
        id: payment.id,
        unitCode: payment.unitCode,
        structureName: payment.structureName,
        paymentDate: payment.paymentDate,
        amount: payment.amount,
        currency: payment.currency,
        exchangeRate: payment.exchangeRate,
        amountBaseCurrency: payment.amountBaseCurrency,
        referenceNumber: payment.referenceNumber || "S/R",
        methodName: payment.methodName || "Método asistido",
        methodType: payment.methodType,
        status: payment.status,
        origin: payment.origin,
        isPartial: payment.isPartial,
        hasReceipt: payment.hasReceipt,
        registeredByEmail: payment.registeredByEmail,
      },
      allocations: payment.allocations,
    };
  }
}
