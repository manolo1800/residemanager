import { z } from "zod";
import { uuidSchema } from "./common.schema";

export const unitTypeSchema = z.enum(["apartment", "house"]);
export type UnitType = z.infer<typeof unitTypeSchema>;

export const unitStatusSchema = z.enum(["active", "inactive"]);
export type UnitStatus = z.infer<typeof unitStatusSchema>;

export const createUnitRequestSchema = z.object({
  structureId: uuidSchema.optional().nullable(),
  code: z.string().min(1).max(50),
  floor: z.number().int().optional().nullable(),
  type: unitTypeSchema.default("apartment"),
  areaM2: z.union([z.number(), z.string()]).optional().nullable(),
  aliquotPct: z.union([z.number(), z.string()]).optional().nullable(),
  status: unitStatusSchema.default("active"),
});

export type CreateUnitRequest = z.infer<typeof createUnitRequestSchema>;

export const updateUnitRequestSchema = createUnitRequestSchema.partial();
export type UpdateUnitRequest = z.infer<typeof updateUnitRequestSchema>;

export const unitResponseSchema = z.object({
  id: uuidSchema,
  tenantId: uuidSchema,
  condominiumId: uuidSchema,
  structureId: uuidSchema.nullable().optional(),
  structureName: z.string().nullable().optional(),
  code: z.string(),
  floor: z.number().int().nullable().optional(),
  type: unitTypeSchema,
  areaM2: z.string().nullable().optional(),
  aliquotPct: z.string().nullable().optional(),
  status: unitStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type UnitResponse = z.infer<typeof unitResponseSchema>;

export const bulkImportUnitsItemSchema = z.object({
  code: z.string().min(1).max(50),
  structureName: z.string().optional().nullable(),
  floor: z.number().int().optional().nullable(),
  type: unitTypeSchema.default("apartment"),
  areaM2: z.union([z.number(), z.string()]).optional().nullable(),
  aliquotPct: z.union([z.number(), z.string()]).optional().nullable(),
});

export type BulkImportUnitsItem = z.infer<typeof bulkImportUnitsItemSchema>;

export const bulkImportUnitsRequestSchema = z.object({
  units: z.array(bulkImportUnitsItemSchema).min(1).max(500),
});

export type BulkImportUnitsRequest = z.infer<typeof bulkImportUnitsRequestSchema>;

export const bulkImportResultSchema = z.object({
  totalProcessed: z.number(),
  totalCreated: z.number(),
  errors: z.array(
    z.object({
      row: z.number(),
      code: z.string(),
      message: z.string(),
    })
  ),
});

export type BulkImportResult = z.infer<typeof bulkImportResultSchema>;
