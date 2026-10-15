import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ExpenseService } from "../../application/services/expense.service";
import { RequirePermission } from "../../../../common/decorators/permissions.decorator";
import { createSupplierInvoiceSchema, createSupplierPaymentSchema } from "@sgc/contracts";

@ApiTags("Expenses - Supplier Invoices & Accounts Payable")
@ApiBearerAuth()
@Controller("v1/supplier-invoices")
export class SupplierInvoicesController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Get()
  @RequirePermission("expenses:invoice.list")
  @ApiOperation({ summary: "List supplier invoices with status & overdue detection" })
  async listInvoices(
    @Query("condominiumId") condominiumId: string,
    @Query("supplierId") supplierId?: string,
    @Query("status") status?: any
  ) {
    return this.expenseService.listSupplierInvoices(condominiumId, {
      supplierId,
      status,
    });
  }

  @Post()
  @RequirePermission("expenses:invoice.create")
  @ApiOperation({ summary: "Register invoice/bill from supplier" })
  async createInvoice(@Body() body: any) {
    const validated = createSupplierInvoiceSchema.parse(body);
    return this.expenseService.createSupplierInvoice(validated);
  }

  @Post(":id/pay")
  @RequirePermission("expenses:invoice.pay")
  @ApiOperation({ summary: "Make payment to supplier invoice" })
  async payInvoice(@Param("id") id: string, @Body() body: any) {
    const payload = {
      ...body,
      supplierInvoiceId: id,
    };
    const validated = createSupplierPaymentSchema.parse(payload);
    return this.expenseService.paySupplierInvoice(validated);
  }
}
