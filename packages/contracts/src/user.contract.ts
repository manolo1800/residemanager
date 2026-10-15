import { z } from "zod";
import { uuidSchema } from "./common.schema";

export const createUserRequestSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  password: z.string().min(8),
  phone: z.string().optional(),
  roleCode: z.string(),
  condominiumId: uuidSchema.optional(),
});

export type CreateUserRequest = z.infer<typeof createUserRequestSchema>;

export const userResponseSchema = z.object({
  id: uuidSchema,
  email: z.string(),
  fullName: z.string(),
  phone: z.string().nullable().optional(),
  locale: z.string(),
  status: z.string(),
  isSuperAdmin: z.boolean(),
  createdAt: z.string(),
});

export type UserResponse = z.infer<typeof userResponseSchema>;
