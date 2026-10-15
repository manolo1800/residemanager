import { z } from "zod";

export const paymentMethodTypeEnum = z.enum([
  "transfer",
  "mobile_payment",
  "cash",
  "check",
  "other",
]);

export const paymentStatusEnum = z.enum([
  "pending",
  "in_review",
  "approved",
  "approved_pending_data",
  "rejected",
  "cancelled",
]);

export const paymentOriginEnum = z.enum(["resident", "admin"]);

// 1. Payment Methods Schemas
export const createPaymentMethodSchema = z.object({
  condominiumId: z.string().uuid(),
  name: z.string().min(1, "El nombre del medio de pago es requerido"),
  type: paymentMethodTypeEnum,
  details: z.record(z.any()).optional().default({}),
  requiresReference: z.boolean().default(true),
  requiresPhone: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const updatePaymentMethodSchema = z.object({
  name: z.string().min(1).optional(),
  type: paymentMethodTypeEnum.optional(),
  details: z.record(z.any()).optional(),
  requiresReference: z.boolean().optional(),
  requiresPhone: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export type CreatePaymentMethodRequest = z.infer<typeof createPaymentMethodSchema>;
export type UpdatePaymentMethodRequest = z.infer<typeof updatePaymentMethodSchema>;

// 2. Payments Schemas
// Resident submission
export const createPaymentSchema = z.object({
  condominiumId: z.string().uuid(),
  unitId: z.string().uuid(),
  methodId: z.string().uuid().optional().nullable(),
  amount: z.union([z.string(), z.number()]).transform((v) => String(v)),
  currency: z.string().min(1).default("USD"),
  exchangeRate: z.union([z.string(), z.number()]).transform((v) => String(v)).optional().nullable(),
  amountBaseCurrency: z.union([z.string(), z.number()]).transform((v) => String(v)).optional().nullable(),
  referenceNumber: z.string().optional().nullable(),
  paymentDate: z.string().min(10, "Fecha de pago requerida (YYYY-MM-DD)"),
  phoneFrom: z.string().optional().nullable(),
  chargeIds: z.array(z.string().uuid()).min(1, "Debe seleccionar al menos un cargo o mes para pagar"),
  receiptFileUrl: z.string().optional().nullable(),
  receiptFileName: z.string().optional().nullable(),
  receiptFileType: z.string().optional().nullable(),
});

// Admin manual registration (assisted payment)
export const createAdminPaymentSchema = z.object({
  condominiumId: z.string().uuid(),
  unitId: z.string().uuid(),
  residentUserId: z.string().uuid().optional().nullable(),
  methodId: z.string().uuid().optional().nullable(),
  amount: z.union([z.string(), z.number()]).transform((v) => String(v)),
  currency: z.string().min(1).default("USD"),
  exchangeRate: z.union([z.string(), z.number()]).transform((v) => String(v)).optional().nullable(),
  amountBaseCurrency: z.union([z.string(), z.number()]).transform((v) => String(v)).optional().nullable(),
  referenceNumber: z.string().optional().nullable(),
  paymentDate: z.string().min(10, "Fecha de pago requerida (YYYY-MM-DD)"),
  phoneFrom: z.string().optional().nullable(),
  chargeIds: z.array(z.string().uuid()).optional().default([]),
  // If without complete data/receipt, it marks approved_pending_data
  isApprovedPendingData: z.boolean().optional().default(false),
  pendingDataReason: z.string().optional().nullable(),
  reviewNotes: z.string().optional().nullable(),
  receiptFileUrl: z.string().optional().nullable(),
  receiptFileName: z.string().optional().nullable(),
  receiptFileType: z.string().optional().nullable(),
});

// Complete data for an approved_pending_data payment
export const completePaymentDataSchema = z.object({
  methodId: z.string().uuid().optional().nullable(),
  referenceNumber: z.string().optional().nullable(),
  phoneFrom: z.string().optional().nullable(),
  receiptFileUrl: z.string().optional().nullable(),
  receiptFileName: z.string().optional().nullable(),
  receiptFileType: z.string().optional().nullable(),
  reviewNotes: z.string().optional().nullable(),
});

// Admin Review (Approve / Reject)
export const reviewPaymentSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reviewNotes: z.string().optional().nullable(),
  reason: z.string().optional().nullable(), // Required when rejecting
});

export type CreatePaymentRequest = z.infer<typeof createPaymentSchema>;
export type CreateAdminPaymentRequest = z.infer<typeof createAdminPaymentSchema>;
export type CompletePaymentDataRequest = z.infer<typeof completePaymentDataSchema>;
export type ReviewPaymentRequest = z.infer<typeof reviewPaymentSchema>;
