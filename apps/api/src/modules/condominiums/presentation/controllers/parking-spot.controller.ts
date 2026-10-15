import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ParkingSpotService } from "../../application/services/parking-spot.service";
import { RequirePermission } from "../../../../common/decorators/permissions.decorator";
import {
  createParkingSpotRequestSchema,
  updateParkingSpotRequestSchema,
} from "@sgc/contracts";

@ApiTags("Condominium Parking Spots")
@ApiBearerAuth()
@Controller("v1/condominiums/:condoId/parking-spots")
export class ParkingSpotController {
  constructor(private readonly parkingService: ParkingSpotService) {}

  @Get()
  @RequirePermission("condominiums:read")
  @ApiOperation({ summary: "List parking spots in condominium" })
  @ApiResponse({ status: 200, description: "List of parking spots" })
  async list(@Param("condoId") condoId: string) {
    return this.parkingService.listParkingSpots(condoId);
  }

  @Get(":id")
  @RequirePermission("condominiums:read")
  @ApiOperation({ summary: "Get parking spot details" })
  async getOne(@Param("condoId") condoId: string, @Param("id") id: string) {
    return this.parkingService.getParkingSpot(condoId, id);
  }

  @Post()
  @RequirePermission("condominiums:update")
  @ApiOperation({ summary: "Create parking spot" })
  @ApiResponse({ status: 201, description: "Parking spot created" })
  async create(@Param("condoId") condoId: string, @Body() body: any) {
    const parsed = createParkingSpotRequestSchema.parse(body);
    return this.parkingService.createParkingSpot(condoId, parsed);
  }

  @Patch(":id")
  @RequirePermission("condominiums:update")
  @ApiOperation({ summary: "Update parking spot" })
  async update(
    @Param("condoId") condoId: string,
    @Param("id") id: string,
    @Body() body: any
  ) {
    const parsed = updateParkingSpotRequestSchema.parse(body);
    return this.parkingService.updateParkingSpot(condoId, id, parsed);
  }

  @Delete(":id")
  @RequirePermission("condominiums:update")
  @ApiOperation({ summary: "Delete parking spot" })
  async delete(@Param("condoId") condoId: string, @Param("id") id: string) {
    return this.parkingService.deleteParkingSpot(condoId, id);
  }
}
