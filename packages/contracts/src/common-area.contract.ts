import { z } from "zod";
import { uuidSchema } from "./common.schema";

export const commonAreaTypeSchema = z.enum(["park", "pool", "party_room", "gym", "other"]);
export type CommonAreaType = z.infer<typeof commonAreaTypeSchema>;

export const createCommonAreaRequestSchema = z.object({
  name: z.string().min(1).max(255),
  type: commonAreaTypeSchema,
  capacity: z.number().int().positive().optional().nullable(),
});

export type CreateCommonAreaRequest = z.infer<typeof createCommonAreaRequestSchema>;

export const updateCommonAreaRequestSchema = createCommonAreaRequestSchema.partial();
export type UpdateCommonAreaRequest = z.infer<typeof updateCommonAreaRequestSchema>;

export const commonAreaResponseSchema = z.object({
  id: uuidSchema,
  tenantId: uuidSchema,
  condominiumId: uuidSchema,
  name: z.string(),
  type: commonAreaTypeSchema,
  capacity: z.number().int().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CommonAreaResponse = z.infer<typeof commonAreaResponseSchema>;
