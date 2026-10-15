import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CondominiumService } from "../../application/services/condominium.service";
import { RequirePermission } from "../../../../common/decorators/permissions.decorator";
import { Public } from "../../../../common/decorators/public.decorator";
import {
  createCondominiumRequestSchema,
  updateCondominiumRequestSchema,
  updateCondominiumSettingsRequestSchema,
} from "@sgc/contracts";

@ApiTags("Condominiums")
@ApiBearerAuth()
@Controller("v1/condominiums")
export class CondominiumController {
  constructor(private readonly condoService: CondominiumService) {}

  @Public()
  @Get("public-search")
  @ApiOperation({ summary: "Public search of residences / condominiums by name or address" })
  async publicSearch(@Query("q") query: string) {
    return this.condoService.searchPublicCondominiums(query || "");
  }

  @Get()
  @RequirePermission("condominiums:read")
  @ApiOperation({ summary: "List all condominiums for current active tenant" })
  @ApiResponse({ status: 200, description: "List of condominiums" })
  async list() {
    return this.condoService.listCondominiums();
  }

  @Get("search")
  @RequirePermission("condominiums:read")
  @ApiOperation({ summary: "Search condominiums by name, code or address" })
  async search(@Query("q") query: string) {
    return this.condoService.searchCondominiums(query || "");
  }

  @Get(":id")
  @RequirePermission("condominiums:read")
  @ApiOperation({ summary: "Get condominium details by ID" })
  async getOne(@Param("id") id: string) {
    return this.condoService.getCondominium(id);
  }

  @Post()
  @RequirePermission("condominiums:create")
  @ApiOperation({ summary: "Create a new condominium (buildings or houses)" })
  @ApiResponse({ status: 201, description: "Condominium created" })
  async create(@Body() body: any) {
    const parsed = createCondominiumRequestSchema.parse(body);
    return this.condoService.createCondominium(parsed);
  }

  @Patch(":id")
  @RequirePermission("condominiums:update")
  @ApiOperation({ summary: "Update condominium details" })
  async update(@Param("id") id: string, @Body() body: any) {
    const parsed = updateCondominiumRequestSchema.parse(body);
    return this.condoService.updateCondominium(id, parsed);
  }

  @Patch(":id/settings")
  @RequirePermission("condominiums:update")
  @ApiOperation({ summary: "Update condominium operational settings" })
  async updateSettings(@Param("id") id: string, @Body() body: any) {
    const parsed = updateCondominiumSettingsRequestSchema.parse(body);
    return this.condoService.updateSettings(id, parsed);
  }

  @Delete(":id")
  @RequirePermission("condominiums:update")
  @ApiOperation({ summary: "Soft delete condominium" })
  async delete(@Param("id") id: string) {
    return this.condoService.deleteCondominium(id);
  }
}
