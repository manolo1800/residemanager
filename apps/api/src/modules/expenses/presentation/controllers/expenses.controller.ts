import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ExpenseService } from "../../application/services/expense.service";
import { RequirePermission } from "../../../../common/decorators/permissions.decorator";
import { createExpenseSchema, updateExpenseSchema } from "@sgc/contracts";

@ApiTags("Expenses - Operations")
@ApiBearerAuth()
@Controller("v1/expenses")
export class ExpensesController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Get()
  @RequirePermission("expenses:expense.list")
  @ApiOperation({ summary: "List expenses with optional filters" })
  async listExpenses(
    @Query("condominiumId") condominiumId: string,
    @Query("categoryId") categoryId?: string,
    @Query("supplierId") supplierId?: string,
    @Query("status") status?: any,
    @Query("isBankCommission") isBankCommission?: string,
    @Query("fromDate") fromDate?: string,
    @Query("toDate") toDate?: string
  ) {
    return this.expenseService.listExpenses(condominiumId, {
      categoryId,
      supplierId,
      status,
      isBankCommission: isBankCommission === "true" ? true : isBankCommission === "false" ? false : undefined,
      fromDate,
      toDate,
    });
  }

  @Get(":id")
  @RequirePermission("expenses:expense.list")
  @ApiOperation({ summary: "Get expense by ID" })
  async getExpenseById(@Param("id") id: string) {
    return this.expenseService.getExpenseById(id);
  }

  @Post()
  @RequirePermission("expenses:expense.create")
  @ApiOperation({ summary: "Register operational expense with receipt" })
  async createExpense(@Body() body: any) {
    const validated = createExpenseSchema.parse(body);
    return this.expenseService.createExpense(validated);
  }

  @Patch(":id")
  @RequirePermission("expenses:expense.update")
  @ApiOperation({ summary: "Update expense details" })
  async updateExpense(@Param("id") id: string, @Body() body: any) {
    const validated = updateExpenseSchema.parse(body);
    return this.expenseService.updateExpense(id, validated);
  }

  @Delete(":id")
  @RequirePermission("expenses:expense.cancel")
  @ApiOperation({ summary: "Cancel / soft delete expense" })
  async cancelExpense(@Param("id") id: string) {
    return this.expenseService.cancelExpense(id);
  }
}
