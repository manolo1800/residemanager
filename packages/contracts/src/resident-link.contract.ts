import { z } from "zod";
import { uuidSchema } from "./common.schema";
import { condominiumResponseSchema } from "./condominium.contract";
import { unitResponseSchema } from "./unit.contract";

export const createResidentLinkRequestSchema = z.object({
  condominiumId: uuidSchema,
  unitCode: z.string().min(1).max(50),
});

export type CreateResidentLinkRequest = z.infer<typeof createResidentLinkRequestSchema>;

export const resolveResidentLinkRequestSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  rejectionReason: z.string().max(500).optional(),
});

export type ResolveResidentLinkRequest = z.infer<typeof resolveResidentLinkRequestSchema>;

export const residentLinkRequestResponseSchema = z.object({
  id: uuidSchema,
  tenantId: uuidSchema,
  userId: uuidSchema,
  condominiumId: uuidSchema,
  unitCode: z.string(),
  status: z.enum(["pending", "approved", "rejected"]),
  rejectionReason: z.string().nullable().optional(),
  requestedAt: z.string().or(z.date()),
  resolvedBy: uuidSchema.nullable().optional(),
  resolvedAt: z.string().or(z.date()).nullable().optional(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  user: z.object({
    id: uuidSchema,
    email: z.string(),
    fullName: z.string(),
    phone: z.string().nullable().optional(),
  }).optional(),
  condominium: z.object({
    id: uuidSchema,
    code: z.string(),
    name: z.string(),
    address: z.string().optional(),
  }).optional(),
});

export type ResidentLinkRequestResponse = z.infer<typeof residentLinkRequestResponseSchema>;

export const residentPropertyResponseSchema = z.object({
  ownershipId: uuidSchema,
  unitId: uuidSchema,
  unitCode: z.string(),
  unitType: z.string(),
  structureName: z.string().nullable().optional(),
  condominiumId: uuidSchema,
  condominiumName: z.string(),
  condominiumCode: z.string(),
  condominiumAddress: z.string(),
  startDate: z.string(),
  isPrimaryResidence: z.boolean(),
  status: z.string(),
});

export type ResidentPropertyResponse = z.infer<typeof residentPropertyResponseSchema>;
