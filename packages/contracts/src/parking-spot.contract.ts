import { z } from "zod";
import { uuidSchema } from "./common.schema";

export const parkingTypeSchema = z.enum(["resident", "visitor"]);
export type ParkingType = z.infer<typeof parkingTypeSchema>;

export const createParkingSpotRequestSchema = z.object({
  code: z.string().min(1).max(50),
  type: parkingTypeSchema,
  assignedUnitId: uuidSchema.optional().nullable(),
});

export type CreateParkingSpotRequest = z.infer<typeof createParkingSpotRequestSchema>;

export const updateParkingSpotRequestSchema = createParkingSpotRequestSchema.partial();
export type UpdateParkingSpotRequest = z.infer<typeof updateParkingSpotRequestSchema>;

export const parkingSpotResponseSchema = z.object({
  id: uuidSchema,
  tenantId: uuidSchema,
  condominiumId: uuidSchema,
  code: z.string(),
  type: parkingTypeSchema,
  assignedUnitId: uuidSchema.nullable().optional(),
  assignedUnitCode: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ParkingSpotResponse = z.infer<typeof parkingSpotResponseSchema>;
