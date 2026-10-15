import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ExpenseService } from "../../application/services/expense.service";
import { RequirePermission } from "../../../../common/decorators/permissions.decorator";
import { createExpenseCategorySchema, updateExpenseCategorySchema } from "@sgc/contracts";

@ApiTags("Expenses - Categories")
@ApiBearerAuth()
@Controller("v1/expense-categories")
export class ExpenseCategoriesController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Get()
  @RequirePermission("expenses:category.list")
  @ApiOperation({ summary: "List expense categories for condominium" })
  async listCategories(@Query("condominiumId") condominiumId: string) {
    return this.expenseService.listCategories(condominiumId);
  }

  @Post()
  @RequirePermission("expenses:category.create")
  @ApiOperation({ summary: "Create expense category" })
  async createCategory(@Body() body: any) {
    const validated = createExpenseCategorySchema.parse(body);
    return this.expenseService.createCategory(validated);
  }

  @Patch(":id")
  @RequirePermission("expenses:category.update")
  @ApiOperation({ summary: "Update expense category" })
  async updateCategory(@Param("id") id: string, @Body() body: any) {
    const validated = updateExpenseCategorySchema.parse(body);
    return this.expenseService.updateCategory(id, validated);
  }

  @Delete(":id")
  @RequirePermission("expenses:category.delete")
  @ApiOperation({ summary: "Delete expense category (soft)" })
  async deleteCategory(@Param("id") id: string) {
    return this.expenseService.deleteCategory(id);
  }
}
