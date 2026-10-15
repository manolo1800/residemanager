import { z } from "zod";
import { uuidSchema } from "./common.schema";
import { personResponseSchema } from "./person.contract";

export const assignOwnerRequestSchema = z.object({
  personId: uuidSchema,
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato debe ser YYYY-MM-DD").default(() => new Date().toISOString().split("T")[0]),
  isPrimaryResidence: z.boolean().default(false),
});

export type AssignOwnerRequest = z.infer<typeof assignOwnerRequestSchema>;

export const transferOwnershipRequestSchema = z.object({
  toPersonId: uuidSchema,
  contractFileUrl: z.string().min(1, "El contrato adjunto es obligatorio"),
});

export type TransferOwnershipRequest = z.infer<typeof transferOwnershipRequestSchema>;

export const ownershipResponseSchema = z.object({
  id: uuidSchema,
  tenantId: uuidSchema,
  condominiumId: uuidSchema,
  unitId: uuidSchema,
  personId: uuidSchema,
  startDate: z.string(),
  endDate: z.string().nullable().optional(),
  status: z.enum(["active", "transferred", "inactive"]),
  isPrimaryResidence: z.boolean(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  person: personResponseSchema.optional(),
  unit: z.object({
    id: uuidSchema,
    code: z.string(),
    type: z.string(),
  }).optional(),
});

export type OwnershipResponse = z.infer<typeof ownershipResponseSchema>;

export const ownershipTransferResponseSchema = z.object({
  id: uuidSchema,
  tenantId: uuidSchema,
  condominiumId: uuidSchema,
  unitId: uuidSchema,
  fromPersonId: uuidSchema,
  toPersonId: uuidSchema,
  contractFileUrl: z.string(),
  status: z.enum(["pending", "approved", "rejected"]),
  approvedBy: uuidSchema.nullable().optional(),
  approvedAt: z.string().or(z.date()).nullable().optional(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  fromPerson: personResponseSchema.optional(),
  toPerson: personResponseSchema.optional(),
  unit: z.object({
    id: uuidSchema,
    code: z.string(),
  }).optional(),
});

export type OwnershipTransferResponse = z.infer<typeof ownershipTransferResponseSchema>;
