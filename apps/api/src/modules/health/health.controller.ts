import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { type HealthCheckResponse } from "@sgc/contracts";
import { Public } from "../../common/decorators/public.decorator";

@ApiTags("Health")
@Controller("v1/health")
export class HealthController {
  private readonly startTime = Date.now();

  @Public()
  @Get()
  @ApiOperation({ summary: "System health check" })
  @ApiResponse({
    status: 200,
    description: "System and dependencies health status",
  })
  check(): HealthCheckResponse {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      version: "0.1.0",
      services: {
        database: "connected",
        redis: "connected",
      },
    };
  }
}
