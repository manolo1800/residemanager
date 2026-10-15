import { z } from "zod";
import { uuidSchema } from "./common.schema";

export const createTenantRequestSchema = z.object({
  name: z.string().min(2).max(255),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/).optional(),
  primaryLocale: z.enum(["es", "en", "fr", "pt"]).default("es"),
  primaryTimezone: z.string().default("America/Caracas"),
  dateFormat: z.string().default("DD/MM/YYYY"),
});

export type CreateTenantRequest = z.infer<typeof createTenantRequestSchema>;

export const updateTenantRequestSchema = createTenantRequestSchema.partial();
export type UpdateTenantRequest = z.infer<typeof updateTenantRequestSchema>;

export const tenantResponseSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  slug: z.string(),
  status: z.string(),
  plan: z.string(),
  primaryLocale: z.string(),
  primaryTimezone: z.string(),
  dateFormat: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type TenantResponse = z.infer<typeof tenantResponseSchema>;
