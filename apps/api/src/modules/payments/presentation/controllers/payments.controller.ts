import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { PaymentService } from "../../application/services/payment.service";
import { RequirePermission } from "../../../../common/decorators/permissions.decorator";
import {
  createPaymentSchema,
  createAdminPaymentSchema,
  completePaymentDataSchema,
  reviewPaymentSchema,
} from "@sgc/contracts";

@ApiTags("Payments - Operations")
@ApiBearerAuth()
@Controller("v1/payments")
export class PaymentsController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get()
  @RequirePermission("payments:payment.list")
  @ApiOperation({ summary: "List payments with optional filters" })
  async listPayments(
    @Query("condominiumId") condominiumId?: string,
    @Query("unitId") unitId?: string,
    @Query("status") status?: string,
    @Query("search") search?: string
  ) {
    return this.paymentService.listPayments(condominiumId, {
      unitId,
      status,
      search,
    });
  }

  @Get("pending-data")
  @RequirePermission("payments:payment.list")
  @ApiOperation({ summary: "List payments in approved_pending_data status" })
  async getPendingDataPayments(@Query("condominiumId") condominiumId?: string) {
    return this.paymentService.getPendingDataPayments(condominiumId);
  }

  @Post()
  @RequirePermission("payments:payment.create")
  @ApiOperation({ summary: "Resident registers offline payment with receipt" })
  @ApiResponse({ status: 201, description: "Payment submitted for review" })
  async createResidentPayment(
    @Body() body: any,
    @Headers("idempotency-key") idempotencyKey?: string
  ) {
    const validated = createPaymentSchema.parse(body);
    return this.paymentService.createResidentPayment(validated, idempotencyKey);
  }

  @Post("admin")
  @RequirePermission("payments:payment.register_admin")
  @ApiOperation({ summary: "Admin registers assisted payment (direct or approved_pending_data)" })
  @ApiResponse({ status: 201, description: "Assisted payment registered" })
  async createAdminPayment(
    @Body() body: any,
    @Headers("idempotency-key") idempotencyKey?: string
  ) {
    const validated = createAdminPaymentSchema.parse(body);
    return this.paymentService.createAdminPayment(validated, idempotencyKey);
  }

  @Patch(":id/approve")
  @RequirePermission("payments:payment.approve")
  @ApiOperation({ summary: "Admin approves payment and applies charges" })
  async approvePayment(
    @Param("id") id: string,
    @Body() body: { reviewNotes?: string }
  ) {
    return this.paymentService.approvePayment(id, body?.reviewNotes);
  }

  @Patch(":id/reject")
  @RequirePermission("payments:payment.reject")
  @ApiOperation({ summary: "Admin rejects payment" })
  async rejectPayment(
    @Param("id") id: string,
    @Body() body: { reason: string; reviewNotes?: string }
  ) {
    return this.paymentService.rejectPayment(id, body.reason, body.reviewNotes);
  }

  @Patch(":id/complete-data")
  @RequirePermission("payments:payment.complete_data")
  @ApiOperation({ summary: "Complete pending payment data (transitions to approved)" })
  async completePaymentData(
    @Param("id") id: string,
    @Body() body: any
  ) {
    const validated = completePaymentDataSchema.parse(body);
    return this.paymentService.completePaymentData(id, validated);
  }

  @Get(":id/receipt")
  @RequirePermission("payments:receipt.download")
  @ApiOperation({ summary: "Get official payment receipt data / PDF metadata" })
  async getPaymentReceipt(@Param("id") id: string) {
    return this.paymentService.getPaymentReceiptData(id);
  }

  @Get(":id")
  @RequirePermission("payments:payment.read")
  @ApiOperation({ summary: "Get payment details by ID" })
  async getPaymentById(@Param("id") id: string) {
    return this.paymentService.getPaymentById(id);
  }
}

@ApiTags("Resident - Payments")
@ApiBearerAuth()
@Controller("v1/me/payments")
export class ResidentPaymentsController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get()
  @ApiOperation({ summary: "List payments belonging to the authenticated resident" })
  async getMyPayments() {
    return this.paymentService.getMyPayments();
  }
}
