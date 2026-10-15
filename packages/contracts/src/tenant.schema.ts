import { z } from "zod";
import { uuidSchema } from "./common.schema";

export const tenantContextSchema = z.object({
  userId: uuidSchema,
  tenantId: uuidSchema,
  condominiumId: uuidSchema.optional(),
  role: z.string(),
  email: z.string().email(),
});

export type TenantContext = z.infer<typeof tenantContextSchema>;

export const condominiumHeaderSchema = z.object({
  "x-condominium-id": uuidSchema.optional(),
});
