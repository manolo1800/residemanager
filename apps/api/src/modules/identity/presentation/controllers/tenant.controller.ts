import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { TenantService } from "../../application/services/tenant.service";
import { RequirePermission } from "../../../../common/decorators/permissions.decorator";
import {
  createTenantRequestSchema,
  updateTenantRequestSchema,
} from "@sgc/contracts";

@ApiTags("Tenants")
@ApiBearerAuth()
@Controller("v1/tenants")
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get()
  @RequirePermission("identity:tenant.list")
  @ApiOperation({ summary: "List all tenants (SuperAdmin only)" })
  @ApiResponse({ status: 200, description: "List of registered tenants" })
  async list() {
    return this.tenantService.listTenants();
  }

  @Get(":id")
  @RequirePermission("identity:tenant.list")
  @ApiOperation({ summary: "Get tenant by ID" })
  async getOne(@Param("id") id: string) {
    return this.tenantService.getTenant(id);
  }

  @Post()
  @RequirePermission("identity:tenant.create")
  @ApiOperation({ summary: "Create a new tenant (SuperAdmin only)" })
  @ApiResponse({ status: 201, description: "Tenant created successfully" })
  async create(@Body() body: any) {
    const parsed = createTenantRequestSchema.parse(body);
    return this.tenantService.createTenant(parsed);
  }

  @Patch(":id")
  @RequirePermission("identity:tenant.update")
  @ApiOperation({ summary: "Update tenant details" })
  async update(@Param("id") id: string, @Body() body: any) {
    const parsed = updateTenantRequestSchema.parse(body);
    return this.tenantService.updateTenant(id, parsed);
  }
}
