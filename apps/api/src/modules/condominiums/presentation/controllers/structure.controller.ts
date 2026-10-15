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
import { StructureService } from "../../application/services/structure.service";
import { RequirePermission } from "../../../../common/decorators/permissions.decorator";
import {
  createStructureRequestSchema,
  updateStructureRequestSchema,
} from "@sgc/contracts";

@ApiTags("Condominium Structures")
@ApiBearerAuth()
@Controller("v1/condominiums/:condoId/structures")
export class StructureController {
  constructor(private readonly structureService: StructureService) {}

  @Get()
  @RequirePermission("condominiums:read")
  @ApiOperation({ summary: "List structures (buildings/blocks/stages) in condominium" })
  @ApiResponse({ status: 200, description: "List of structures" })
  async list(@Param("condoId") condoId: string) {
    return this.structureService.listStructures(condoId);
  }

  @Get(":id")
  @RequirePermission("condominiums:read")
  @ApiOperation({ summary: "Get structure details" })
  async getOne(@Param("condoId") condoId: string, @Param("id") id: string) {
    return this.structureService.getStructure(condoId, id);
  }

  @Post()
  @RequirePermission("condominiums:update")
  @ApiOperation({ summary: "Create structure (building, block, stage)" })
  @ApiResponse({ status: 201, description: "Structure created" })
  async create(@Param("condoId") condoId: string, @Body() body: any) {
    const parsed = createStructureRequestSchema.parse(body);
    return this.structureService.createStructure(condoId, parsed);
  }

  @Patch(":id")
  @RequirePermission("condominiums:update")
  @ApiOperation({ summary: "Update structure" })
  async update(
    @Param("condoId") condoId: string,
    @Param("id") id: string,
    @Body() body: any
  ) {
    const parsed = updateStructureRequestSchema.parse(body);
    return this.structureService.updateStructure(condoId, id, parsed);
  }

  @Delete(":id")
  @RequirePermission("condominiums:update")
  @ApiOperation({ summary: "Delete structure (fails if units are assigned)" })
  async delete(@Param("condoId") condoId: string, @Param("id") id: string) {
    return this.structureService.deleteStructure(condoId, id);
  }
}
