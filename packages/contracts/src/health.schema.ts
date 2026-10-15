import { z } from "zod";

export const healthCheckResponseSchema = z.object({
  status: z.literal("ok"),
  timestamp: z.string(),
  uptime: z.number(),
  version: z.string(),
  services: z.object({
    database: z.enum(["connected", "disconnected"]),
    redis: z.enum(["connected", "disconnected"]),
  }),
});

export type HealthCheckResponse = z.infer<typeof healthCheckResponseSchema>;
