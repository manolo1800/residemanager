import { z } from "zod";

export const feeTypeEnum = z.enum(["ordinary", "extraordinary"]);
export const feeModeEnum = z.enum(["fixed", "variable"]);
export const feeScopeEnum = z.enum(["all", "structure", "unit"]);
export const chargeStatusEnum = z.enum(["pending", "partially_paid", "paid", "overdue", "cancelled"]);
export const moraTypeEnum = z.enum(["fixed", "percentage"]);

// Fee Plan
export const createFeePlanSchema = z.object({
  condominiumId: z.string().uuid(),
  name: z.string().min(1, "El nombre de la cuota es requerido"),
  type: feeTypeEnum,
  mode: feeModeEnum.default("fixed"),
  amount: z.union([z.string(), z.number()]).transform((v) => String(v)),
  currency: z.string().min(1).default("USD"),
  appliesTo: feeScopeEnum.default("all"),
  structureId: z.string().uuid().optional().nullable(),
  unitId: z.string().uuid().optional().nullable(),
  taxApplies: z.boolean().default(true),
  startDate: z.string().min(10, "Fecha de inicio inválida"),
  endDate: z.string().optional().nullable(),
  requiresMeeting: z.boolean().default(false),
  minuteId: z.string().uuid().optional().nullable(),
});

export const updateFeePlanSchema = z.object({
  name: z.string().min(1).optional(),
  mode: feeModeEnum.optional(),
  amount: z.union([z.string(), z.number()]).transform((v) => String(v)).optional(),
  currency: z.string().optional(),
  appliesTo: feeScopeEnum.optional(),
  structureId: z.string().uuid().optional().nullable(),
  unitId: z.string().uuid().optional().nullable(),
  taxApplies: z.boolean().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
  requiresMeeting: z.boolean().optional(),
  minuteId: z.string().uuid().optional().nullable(),
  status: z.enum(["active", "cancelled"]).optional(),
});

export type CreateFeePlanRequest = z.infer<typeof createFeePlanSchema>;
export type UpdateFeePlanRequest = z.infer<typeof updateFeePlanSchema>;

// Generate Unit Charges
export const generateUnitChargesSchema = z.object({
  condominiumId: z.string().uuid(),
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "El período debe tener el formato YYYY-MM"),
  dueDate: z.string().optional(),
});

export type GenerateUnitChargesRequest = z.infer<typeof generateUnitChargesSchema>;

// Mora Rules
export const createMoraRuleSchema = z.object({
  condominiumId: z.string().uuid(),
  type: moraTypeEnum,
  value: z.union([z.string(), z.number()]).transform((v) => String(v)),
  appliesAfterDays: z.number().int().min(0).default(1),
});

export type CreateMoraRuleRequest = z.infer<typeof createMoraRuleSchema>;

// Currency Rates
export const createCurrencyRateSchema = z.object({
  condominiumId: z.string().uuid(),
  fromCurrency: z.string().min(1).max(10),
  toCurrency: z.string().min(1).max(10),
  rate: z.union([z.string(), z.number()]).transform((v) => String(v)),
  source: z.string().optional().nullable(),
  effectiveDate: z.string().min(10),
});

export type CreateCurrencyRateRequest = z.infer<typeof createCurrencyRateSchema>;
