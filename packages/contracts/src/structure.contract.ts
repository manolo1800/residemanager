import { z } from "zod";
import { uuidSchema } from "./common.schema";

export const structureKindSchema = z.enum(["building", "block", "stage"]);
export type StructureKind = z.infer<typeof structureKindSchema>;

export const createStructureRequestSchema = z.object({
  name: z.string().min(1).max(255),
  kind: structureKindSchema,
  floors: z.number().int().positive().optional().nullable(),
  position: z.number().int().default(0),
});

export type CreateStructureRequest = z.infer<typeof createStructureRequestSchema>;

export const updateStructureRequestSchema = createStructureRequestSchema.partial();
export type UpdateStructureRequest = z.infer<typeof updateStructureRequestSchema>;

export const structureResponseSchema = z.object({
  id: uuidSchema,
  tenantId: uuidSchema,
  condominiumId: uuidSchema,
  name: z.string(),
  kind: structureKindSchema,
  floors: z.number().int().nullable().optional(),
  position: z.number().int(),
  unitsCount: z.number().int().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type StructureResponse = z.infer<typeof structureResponseSchema>;
