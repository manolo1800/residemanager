import { z } from "zod";
import { uuidSchema } from "./common.schema";

export const createPersonRequestSchema = z.object({
  documentType: z.string().min(1).max(20).default("V"),
  documentNumber: z.string().min(1).max(50),
  fullName: z.string().min(2).max(255),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(50).optional().or(z.literal("")),
});

export type CreatePersonRequest = z.infer<typeof createPersonRequestSchema>;

export const updatePersonRequestSchema = createPersonRequestSchema.partial();
export type UpdatePersonRequest = z.infer<typeof updatePersonRequestSchema>;

export const personResponseSchema = z.object({
  id: uuidSchema,
  tenantId: uuidSchema,
  documentType: z.string(),
  documentNumber: z.string(),
  fullName: z.string(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});

export type PersonResponse = z.infer<typeof personResponseSchema>;
