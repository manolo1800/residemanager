import { Body, Controller, Get, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { UserService } from "../../application/services/user.service";
import { RequirePermission } from "../../../../common/decorators/permissions.decorator";
import { RequestContext } from "../../../../common/context/request-context";
import { createUserRequestSchema } from "@sgc/contracts";
import { FastifyRequest } from "fastify";

@ApiTags("Users")
@ApiBearerAuth()
@Controller("v1/users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @RequirePermission("identity:user.list")
  @ApiOperation({ summary: "List users for the active tenant" })
  @ApiResponse({ status: 200, description: "List of users" })
  async list(@Req() req: FastifyRequest) {
    const user = (req as any).user as RequestContext;
    return this.userService.listUsersForTenant(user.tenantId);
  }

  @Post()
  @RequirePermission("identity:user.create")
  @ApiOperation({ summary: "Create/invite a user into current tenant" })
  @ApiResponse({ status: 201, description: "User created and associated with tenant" })
  async create(@Body() body: any, @Req() req: FastifyRequest) {
    const parsed = createUserRequestSchema.parse(body);
    const user = (req as any).user as RequestContext;
    return this.userService.createUser(parsed, user?.tenantId);
  }
}
