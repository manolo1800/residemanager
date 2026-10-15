import { z } from "zod";
import { uuidSchema } from "./common.schema";

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  condominiumId: uuidSchema.optional(),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
  tokenType: z.literal("Bearer"),
});

export type AuthTokens = z.infer<typeof authTokensSchema>;

export const loginResponseSchema = z.object({
  tokens: authTokensSchema,
  user: z.object({
    id: uuidSchema,
    email: z.string().email(),
    fullName: z.string(),
    locale: z.string(),
    isSuperAdmin: z.boolean(),
  }),
  tenant: z.object({
    id: uuidSchema,
    name: z.string(),
    slug: z.string(),
  }),
  condominium: z
    .object({
      id: uuidSchema,
      name: z.string(),
      code: z.string(),
      type: z.string(),
      timezone: z.string(),
      baseCurrency: z.string(),
    })
    .nullable(),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;

export const refreshTokenRequestSchema = z.object({
  refreshToken: z.string(),
});

export type RefreshTokenRequest = z.infer<typeof refreshTokenRequestSchema>;

export const switchCondominiumRequestSchema = z.object({
  condominiumId: uuidSchema,
});

export type SwitchCondominiumRequest = z.infer<typeof switchCondominiumRequestSchema>;

export const checkEmailRequestSchema = z.object({
  email: z.string().email(),
});

export type CheckEmailRequest = z.infer<typeof checkEmailRequestSchema>;

export const checkEmailResponseSchema = z.object({
  exists: z.boolean(),
  email: z.string().email(),
});

export type CheckEmailResponse = z.infer<typeof checkEmailResponseSchema>;

export const registerCondominiumRequestSchema = z.object({
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
  adminFullName: z.string().min(2),
  adminPhone: z.string().optional().nullable(),
  condoName: z.string().min(2).max(255),
  condoCode: z.string().min(2).max(50),
  condoType: z.enum(["buildings", "houses"]).default("buildings"),
  condoAddress: z.string().default(""),
  baseCurrency: z.string().default("USD"),
});

export type RegisterCondominiumRequest = z.infer<typeof registerCondominiumRequestSchema>;

export const registerResidentRequestSchema = z.object({
  fullName: z.string().min(2).max(255),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional().nullable(),
  documentType: z.string().min(1).max(20).default("V"),
  documentNumber: z.string().min(1).max(50),
  condominiumId: uuidSchema.optional().nullable(),
  unitCode: z.string().optional().nullable(),
});

export type RegisterResidentRequest = z.infer<typeof registerResidentRequestSchema>;
