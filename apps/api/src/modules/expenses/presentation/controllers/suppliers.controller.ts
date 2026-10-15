import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ExpenseService } from "../../application/services/expense.service";
import { RequirePermission } from "../../../../common/decorators/permissions.decorator";
import { createSupplierSchema, updateSupplierSchema } from "@sgc/contracts";

@ApiTags("Expenses - Suppliers")
@ApiBearerAuth()
@Controller("v1/suppliers")
export class SuppliersController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Get()
  @RequirePermission("expenses:supplier.list")
  @ApiOperation({ summary: "List suppliers with optional search" })
  async listSuppliers(
    @Query("condominiumId") condominiumId: string,
    @Query("search") search?: string
  ) {
    return this.expenseService.listSuppliers(condominiumId, search);
  }

  @Get(":id")
  @RequirePermission("expenses:supplier.list")
  @ApiOperation({ summary: "Get supplier details" })
  async getSupplierById(@Param("id") id: string) {
    return this.expenseService.getSupplierById(id);
  }

  @Post()
  @RequirePermission("expenses:supplier.create")
  @ApiOperation({ summary: "Create commercial supplier" })
  async createSupplier(@Body() body: any) {
    const validated = createSupplierSchema.parse(body);
    return this.expenseService.createSupplier(validated);
  }

  @Patch(":id")
  @RequirePermission("expenses:supplier.update")
  @ApiOperation({ summary: "Update supplier details" })
  async updateSupplier(@Param("id") id: string, @Body() body: any) {
    const validated = updateSupplierSchema.parse(body);
    return this.expenseService.updateSupplier(id, validated);
  }
}
