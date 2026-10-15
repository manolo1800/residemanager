import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ResidentLinkService } from "../../application/services/resident-link.service";
import { RequirePermission } from "../../../../common/decorators/permissions.decorator";
import {
  createResidentLinkRequestSchema,
  resolveResidentLinkRequestSchema,
} from "@sgc/contracts";

@ApiTags("Properties - Resident Link Requests & My Properties")
@ApiBearerAuth()
@Controller("v1")
export class ResidentLinkController {
  constructor(private readonly residentLinkService: ResidentLinkService) {}

  @Post("resident-link-requests")
  @RequirePermission("residents:link.create")
  @ApiOperation({ summary: "Resident requests link to a unit with unit code" })
  @ApiResponse({ status: 201, description: "Link request created" })
  async createRequest(@Body() body: any) {
    const validated = createResidentLinkRequestSchema.parse(body);
    return this.residentLinkService.createRequest(validated);
  }

  @Get("resident-link-requests")
  @RequirePermission("residents:link.list")
  @ApiOperation({ summary: "List resident link requests (admin)" })
  async listRequests(
    @Query("condominiumId") condominiumId?: string,
    @Query("status") status?: string
  ) {
    return this.residentLinkService.listRequests(condominiumId, status);
  }

  @Patch("resident-link-requests/:id/approve")
  @RequirePermission("residents:link.approve")
  @ApiOperation({ summary: "Approve resident link request" })
  async approveRequest(@Param("id") id: string) {
    return this.residentLinkService.approveRequest(id);
  }

  @Patch("resident-link-requests/:id/reject")
  @RequirePermission("residents:link.reject")
  @ApiOperation({ summary: "Reject resident link request" })
  async rejectRequest(@Param("id") id: string, @Body() body?: any) {
    const validated = body ? resolveResidentLinkRequestSchema.parse(body) : undefined;
    return this.residentLinkService.rejectRequest(id, validated);
  }

  @Get("me/properties")
  @RequirePermission("residents:properties.list")
  @ApiOperation({ summary: "Get properties associated with authenticated resident" })
  async getMyProperties() {
    return this.residentLinkService.getMyProperties();
  }
}
