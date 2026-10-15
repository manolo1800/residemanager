import { Controller, Get, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ExpenseService } from "../../application/services/expense.service";
import { RequirePermission } from "../../../../common/decorators/permissions.decorator";

@ApiTags("Expenses - Cash Flow & Consolidated Metrics")
@ApiBearerAuth()
@Controller("v1/cashflow")
export class CashflowController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Get("summary")
  @RequirePermission("expenses:expense.list")
  @ApiOperation({ summary: "Get cash flow summary: income vs expenses and balance" })
  async getCashFlowSummary(
    @Query("condominiumId") condominiumId: string,
    @Query("period") period?: string
  ) {
    return this.expenseService.getCashFlowSummary(condominiumId, period);
  }
}
