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
import { CommonAreaService } from "../../application/services/common-area.service";
import { RequirePermission } from "../../../../common/decorators/permissions.decorator";
import {
  createCommonAreaRequestSchema,
  updateCommonAreaRequestSchema,
} from "@sgc/contracts";

@ApiTags("Condominium Common Areas")
@ApiBearerAuth()
@Controller("v1/condominiums/:condoId/common-areas")
export class CommonAreaController {
  constructor(private readonly commonAreaService: CommonAreaService) {}

  @Get()
  @RequirePermission("condominiums:read")
  @ApiOperation({ summary: "List common areas in condominium" })
  @ApiResponse({ status: 200, description: "List of common areas" })
  async list(@Param("condoId") condoId: string) {
    return this.commonAreaService.listCommonAreas(condoId);
  }

  @Get(":id")
  @RequirePermission("condominiums:read")
  @ApiOperation({ summary: "Get common area details" })
  async getOne(@Param("condoId") condoId: string, @Param("id") id: string) {
    return this.commonAreaService.getCommonArea(condoId, id);
  }

  @Post()
  @RequirePermission("condominiums:update")
  @ApiOperation({ summary: "Create common area" })
  @ApiResponse({ status: 201, description: "Common area created" })
  async create(@Param("condoId") condoId: string, @Body() body: any) {
    const parsed = createCommonAreaRequestSchema.parse(body);
    return this.commonAreaService.createCommonArea(condoId, parsed);
  }

  @Patch(":id")
  @RequirePermission("condominiums:update")
  @ApiOperation({ summary: "Update common area" })
  async update(
    @Param("condoId") condoId: string,
    @Param("id") id: string,
    @Body() body: any
  ) {
    const parsed = updateCommonAreaRequestSchema.parse(body);
    return this.commonAreaService.updateCommonArea(condoId, id, parsed);
  }

  @Delete(":id")
  @RequirePermission("condominiums:update")
  @ApiOperation({ summary: "Delete common area" })
  async delete(@Param("condoId") condoId: string, @Param("id") id: string) {
    return this.commonAreaService.deleteCommonArea(condoId, id);
  }
}
