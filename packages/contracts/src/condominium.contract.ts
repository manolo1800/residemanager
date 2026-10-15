import { z } from "zod";
import { uuidSchema } from "./common.schema";

export const condominiumTypeSchema = z.enum(["buildings", "houses"]);
export type CondominiumType = z.infer<typeof condominiumTypeSchema>;

export const ordinaryFeeModeSchema = z.enum(["fixed", "variable"]);
export type OrdinaryFeeMode = z.infer<typeof ordinaryFeeModeSchema>;

export const moraTypeSchema = z.enum(["fixed", "percentage"]);
export type MoraType = z.infer<typeof moraTypeSchema>;

export const createCondominiumRequestSchema = z.object({
  name: z.string().min(2).max(255),
  code: z.string().min(2).max(50),
  type: condominiumTypeSchema.default("buildings"),
  address: z.string().default(""),
  country: z.string().length(2).default("VE"),
  timezone: z.string().default("America/Caracas"),
  dateFormat: z.string().default("DD/MM/YYYY"),
  baseCurrency: z.string().default("USD"),
  foreignCurrency: z.string().optional().nullable(),
  foreignCurrencyEnabled: z.boolean().default(false),
  taxExempt: z.boolean().default(false),
  taxRate: z.union([z.number(), z.string()]).optional().nullable(),
  taxIncludedInFee: z.boolean().default(true),
  ordinaryFeeMode: ordinaryFeeModeSchema.default("fixed"),
  extraordinaryRequiresMeeting: z.boolean().default(true),
  moraType: moraTypeSchema.default("percentage"),
  moraValue: z.union([z.number(), z.string()]).default(0),
  partialPaymentsEnabled: z.boolean().default(false),
  partialPaymentInterestEnabled: z.boolean().default(false),
  termsOwnEnabled: z.boolean().default(false),
  termsOwnContent: z.string().optional().nullable(),
  branding: z
    .object({
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      logoUrl: z.string().url().optional(),
      faviconUrl: z.string().url().optional(),
    })
    .optional(),
});

export type CreateCondominiumRequest = z.infer<typeof createCondominiumRequestSchema>;

export const updateCondominiumRequestSchema = createCondominiumRequestSchema.partial();
export type UpdateCondominiumRequest = z.infer<typeof updateCondominiumRequestSchema>;

export const updateCondominiumSettingsRequestSchema = z.object({
  timezone: z.string().optional(),
  dateFormat: z.string().optional(),
  baseCurrency: z.string().optional(),
  foreignCurrency: z.string().optional().nullable(),
  foreignCurrencyEnabled: z.boolean().optional(),
  taxExempt: z.boolean().optional(),
  taxRate: z.union([z.number(), z.string()]).optional().nullable(),
  taxIncludedInFee: z.boolean().optional(),
  ordinaryFeeMode: ordinaryFeeModeSchema.optional(),
  extraordinaryRequiresMeeting: z.boolean().optional(),
  moraType: moraTypeSchema.optional(),
  moraValue: z.union([z.number(), z.string()]).optional(),
  partialPaymentsEnabled: z.boolean().optional(),
  partialPaymentInterestEnabled: z.boolean().optional(),
  termsOwnEnabled: z.boolean().optional(),
  termsOwnContent: z.string().optional().nullable(),
  branding: z
    .object({
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      logoUrl: z.string().optional(),
      faviconUrl: z.string().optional(),
    })
    .optional(),
});

export type UpdateCondominiumSettingsRequest = z.infer<
  typeof updateCondominiumSettingsRequestSchema
>;

export const condominiumResponseSchema = z.object({
  id: uuidSchema,
  tenantId: uuidSchema,
  name: z.string(),
  code: z.string(),
  type: z.string(),
  address: z.string(),
  country: z.string(),
  timezone: z.string(),
  dateFormat: z.string().optional(),
  baseCurrency: z.string(),
  foreignCurrency: z.string().nullable().optional(),
  foreignCurrencyEnabled: z.boolean().optional(),
  taxExempt: z.boolean().optional(),
  taxRate: z.string().nullable().optional(),
  taxIncludedInFee: z.boolean().optional(),
  ordinaryFeeMode: z.string().optional(),
  extraordinaryRequiresMeeting: z.boolean().optional(),
  moraType: z.string().optional(),
  moraValue: z.string().optional(),
  partialPaymentsEnabled: z.boolean().optional(),
  partialPaymentInterestEnabled: z.boolean().optional(),
  termsOwnEnabled: z.boolean().optional(),
  termsOwnContent: z.string().nullable().optional(),
  branding: z
    .object({
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      logoUrl: z.string().optional(),
      faviconUrl: z.string().optional(),
    })
    .nullable()
    .optional(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CondominiumResponse = z.infer<typeof condominiumResponseSchema>;
