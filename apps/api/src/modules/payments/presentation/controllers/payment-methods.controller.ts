import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { PaymentService } from "../../application/services/payment.service";
import { RequirePermission } from "../../../../common/decorators/permissions.decorator";
import { createPaymentMethodSchema, updatePaymentMethodSchema } from "@sgc/contracts";

@ApiTags("Payments - Payment Methods")
@ApiBearerAuth()
@Controller("v1/payment-methods")
export class PaymentMethodsController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get()
  @RequirePermission("payments:method.list")
  @ApiOperation({ summary: "List payment methods for a condominium" })
  async listPaymentMethods(
    @Query("condominiumId") condominiumId: string,
    @Query("onlyActive") onlyActive?: string
  ) {
    return this.paymentService.listPaymentMethods(
      condominiumId,
      onlyActive === "true" || onlyActive === "1"
    );
  }

  @Post()
  @RequirePermission("payments:method.create")
  @ApiOperation({ summary: "Create a payment method" })
  @ApiResponse({ status: 201, description: "Payment method created" })
  async createPaymentMethod(@Body() body: any) {
    const validated = createPaymentMethodSchema.parse(body);
    return this.paymentService.createPaymentMethod(validated);
  }

  @Patch(":id")
  @RequirePermission("payments:method.update")
  @ApiOperation({ summary: "Update payment method" })
  async updatePaymentMethod(@Param("id") id: string, @Body() body: any) {
    const validated = updatePaymentMethodSchema.parse(body);
    return this.paymentService.updatePaymentMethod(id, validated);
  }
}
