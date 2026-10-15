import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ExpenseService } from "../../application/services/expense.service";
import { RequirePermission } from "../../../../common/decorators/permissions.decorator";
import { createBudgetSchema, updateBudgetSchema } from "@sgc/contracts";

@ApiTags("Expenses - Budgets")
@ApiBearerAuth()
@Controller("v1/budgets")
export class BudgetsController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Get()
  @RequirePermission("expenses:budget.list")
  @ApiOperation({ summary: "List budgets by period" })
  async listBudgets(
    @Query("condominiumId") condominiumId: string,
    @Query("period") period?: string
  ) {
    return this.expenseService.listBudgets(condominiumId, period);
  }

  @Get("summary")
  @RequirePermission("expenses:budget.list")
  @ApiOperation({ summary: "Get budget vs actual expenses tracking and alerts" })
  async getBudgetsSummary(
    @Query("condominiumId") condominiumId: string,
    @Query("period") period: string
  ) {
    const selectedPeriod = period || new Date().toISOString().slice(0, 7);
    return this.expenseService.getBudgetsSummary(condominiumId, selectedPeriod);
  }

  @Post()
  @RequirePermission("expenses:budget.create")
  @ApiOperation({ summary: "Create monthly budget for category" })
  async createBudget(@Body() body: any) {
    const validated = createBudgetSchema.parse(body);
    return this.expenseService.createBudget(validated);
  }

  @Patch(":id")
  @RequirePermission("expenses:budget.update")
  @ApiOperation({ summary: "Update monthly budget amount or threshold" })
  async updateBudget(@Param("id") id: string, @Body() body: any) {
    const validated = updateBudgetSchema.parse(body);
    return this.expenseService.updateBudget(id, validated);
  }
}
