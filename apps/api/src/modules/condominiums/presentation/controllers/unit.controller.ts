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
import { UnitService } from "../../application/services/unit.service";
import { RequirePermission } from "../../../../common/decorators/permissions.decorator";
import {
  createUnitRequestSchema,
  updateUnitRequestSchema,
  bulkImportUnitsRequestSchema,
} from "@sgc/contracts";

@ApiTags("Condominium Units")
@ApiBearerAuth()
@Controller("v1/condominiums/:condoId/units")
export class UnitController {
  constructor(private readonly unitService: UnitService) {}

  @Get()
  @RequirePermission("condominiums:read")
  @ApiOperation({ summary: "List units in condominium with filters and pagination" })
  @ApiResponse({ status: 200, description: "List of units" })
  async list(
    @Param("condoId") condoId: string,
    @Query("structureId") structureId?: string,
    @Query("type") type?: string,
    @Query("status") status?: string,
    @Query("search") search?: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string
  ) {
    return this.unitService.listUnits(condoId, {
      structureId,
      type,
      status,
      search,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });
  }

  @Get(":id")
  @RequirePermission("condominiums:read")
  @ApiOperation({ summary: "Get unit details" })
  async getOne(@Param("condoId") condoId: string, @Param("id") id: string) {
    return this.unitService.getUnit(condoId, id);
  }

  @Post()
  @RequirePermission("condominiums:update")
  @ApiOperation({ summary: "Create single unit" })
  @ApiResponse({ status: 201, description: "Unit created" })
  async create(@Param("condoId") condoId: string, @Body() body: any) {
    const parsed = createUnitRequestSchema.parse(body);
    return this.unitService.createUnit(condoId, parsed);
  }

  @Post("import")
  @RequirePermission("condominiums:update")
  @ApiOperation({ summary: "Bulk import units via JSON array or raw CSV" })
  @ApiResponse({ status: 200, description: "Import results report" })
  async importUnits(@Param("condoId") condoId: string, @Body() body: any) {
    if (typeof body.csv === "string") {
      const parsedUnits = this.unitService.parseCsv(body.csv);
      return this.unitService.importUnits(condoId, parsedUnits);
    }

    const parsed = bulkImportUnitsRequestSchema.parse(body);
    return this.unitService.importUnits(condoId, parsed.units);
  }

  @Patch(":id")
  @RequirePermission("condominiums:update")
  @ApiOperation({ summary: "Update unit" })
  async update(
    @Param("condoId") condoId: string,
    @Param("id") id: string,
    @Body() body: any
  ) {
    const parsed = updateUnitRequestSchema.parse(body);
    return this.unitService.updateUnit(condoId, id, parsed);
  }

  @Delete(":id")
  @RequirePermission("condominiums:update")
  @ApiOperation({ summary: "Soft delete unit" })
  async delete(@Param("condoId") condoId: string, @Param("id") id: string) {
    return this.unitService.deleteUnit(condoId, id);
  }
}
