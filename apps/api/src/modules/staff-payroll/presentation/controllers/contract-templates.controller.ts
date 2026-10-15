import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { StaffPayrollService } from "../../application/services/staff-payroll.service";
import { RequirePermission } from "../../../../common/decorators/permissions.decorator";
import {
  createContractTemplateSchema,
  updateContractTemplateSchema,
} from "@sgc/contracts";

@ApiTags("Staff & Payroll - Contract Templates")
@ApiBearerAuth()
@Controller("v1/contract-templates")
export class ContractTemplatesController {
  constructor(private readonly service: StaffPayrollService) {}

  @Get()
  @RequirePermission("staff:template.list")
  @ApiOperation({ summary: "List contract templates" })
  async listTemplates() {
    return this.service.listTemplates();
  }

  @Post()
  @RequirePermission("staff:template.create")
  @ApiOperation({ summary: "Create contract template" })
  async createTemplate(@Body() body: any) {
    const validated = createContractTemplateSchema.parse(body);
    return this.service.createTemplate(validated);
  }

  @Patch(":id")
  @RequirePermission("staff:template.create")
  @ApiOperation({ summary: "Update contract template" })
  async updateTemplate(@Param("id") id: string, @Body() body: any) {
    const validated = updateContractTemplateSchema.parse(body);
    return this.service.updateTemplate(id, validated);
  }
}
