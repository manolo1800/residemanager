import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { OwnershipService } from "../../application/services/ownership.service";
import { RequirePermission } from "../../../../common/decorators/permissions.decorator";
import {
  assignOwnerRequestSchema,
  transferOwnershipRequestSchema,
} from "@sgc/contracts";

@ApiTags("Properties - Ownerships & Transfers")
@ApiBearerAuth()
@Controller("v1")
export class OwnershipController {
  constructor(private readonly ownershipService: OwnershipService) {}

  @Get("condominiums/:condoId/units/:unitId/ownerships")
  @RequirePermission("properties:ownership.list")
  @ApiOperation({ summary: "List ownership history for a unit" })
  async listUnitOwnerships(
    @Param("condoId") condoId: string,
    @Param("unitId") unitId: string
  ) {
    return this.ownershipService.listUnitOwnerships(condoId, unitId);
  }

  @Post("condominiums/:condoId/units/:unitId/ownerships")
  @RequirePermission("properties:ownership.create")
  @ApiOperation({ summary: "Assign owner to a unit" })
  @ApiResponse({ status: 201, description: "Owner assigned" })
  async assignOwner(
    @Param("condoId") condoId: string,
    @Param("unitId") unitId: string,
    @Body() body: any
  ) {
    const validated = assignOwnerRequestSchema.parse(body);
    return this.ownershipService.assignOwner(condoId, unitId, validated);
  }

  @Post("ownerships/:id/transfer")
  @RequirePermission("properties:transfer.create")
  @ApiOperation({ summary: "Initiate ownership transfer" })
  @ApiResponse({ status: 201, description: "Transfer initiated" })
  async initiateTransfer(@Param("id") id: string, @Body() body: any) {
    const validated = transferOwnershipRequestSchema.parse(body);
    return this.ownershipService.initiateTransfer(id, validated);
  }

  @Get("condominiums/:condoId/transfers")
  @RequirePermission("properties:ownership.list")
  @ApiOperation({ summary: "List transfers for a condominium" })
  async listTransfers(
    @Param("condoId") condoId: string,
    @Query("status") status?: string
  ) {
    return this.ownershipService.listTransfers(condoId, status);
  }

  @Patch("transfers/:id/approve")
  @RequirePermission("properties:transfer.approve")
  @ApiOperation({ summary: "Approve ownership transfer" })
  async approveTransfer(@Param("id") id: string) {
    return this.ownershipService.approveTransfer(id);
  }

  @Patch("transfers/:id/reject")
  @RequirePermission("properties:transfer.reject")
  @ApiOperation({ summary: "Reject ownership transfer" })
  async rejectTransfer(@Param("id") id: string) {
    return this.ownershipService.rejectTransfer(id);
  }
}
