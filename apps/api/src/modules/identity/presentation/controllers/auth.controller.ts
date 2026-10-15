import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { AuthService } from "../../application/services/auth.service";
import { UserService } from "../../application/services/user.service";
import { Public } from "../../../../common/decorators/public.decorator";
import { RequestContext } from "../../../../common/context/request-context";
import {
  checkEmailRequestSchema,
  LoginRequest,
  loginRequestSchema,
  RefreshTokenRequest,
  refreshTokenRequestSchema,
  registerCondominiumRequestSchema,
  registerResidentRequestSchema,
  SwitchCondominiumRequest,
  switchCondominiumRequestSchema,
} from "@sgc/contracts";
import { FastifyRequest } from "fastify";

@ApiTags("Auth")
@Controller("v1/auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService
  ) {}

  @Public()
  @Get("check-email")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Check if an email is already registered in the system" })
  @ApiResponse({ status: 200, description: "Returns if the email exists" })
  async checkEmail(@Query("email") email: string) {
    const parsed = checkEmailRequestSchema.parse({ email });
    return this.authService.checkEmail(parsed.email);
  }

  @Public()
  @Post("register-resident")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Autonomous registration for a resident without creating a condominium" })
  @ApiResponse({ status: 201, description: "Resident registered, session and tokens issued" })
  async registerResident(@Body() body: any, @Req() req: FastifyRequest) {
    const parsed = registerResidentRequestSchema.parse(body);
    return this.authService.registerResident(
      parsed,
      req.ip,
      req.headers["user-agent"]
    );
  }

  @Public()
  @Post("register-condominium")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Register a new principal admin and their first condominium" })
  @ApiResponse({ status: 201, description: "Admin and condominium registered, session issued" })
  async registerCondominium(@Body() body: any, @Req() req: FastifyRequest) {
    const parsed = registerCondominiumRequestSchema.parse(body);
    return this.authService.registerCondominium(
      parsed,
      req.ip,
      req.headers["user-agent"]
    );
  }

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "User authentication via email and password (Argon2id)" })
  @ApiResponse({ status: 200, description: "Login successful with JWT and refresh token" })
  async login(@Body() body: any, @Req() req: FastifyRequest) {
    const parsed = loginRequestSchema.parse(body);
    return this.authService.login(
      parsed,
      req.ip,
      req.headers["user-agent"]
    );
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Rotate refresh token and issue new access token" })
  @ApiResponse({ status: 200, description: "New access token and rotated refresh token" })
  async refresh(@Body() body: any, @Req() req: FastifyRequest) {
    const parsed = refreshTokenRequestSchema.parse(body);
    return this.authService.refresh(
      parsed,
      req.ip,
      req.headers["user-agent"]
    );
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Revoke active session and refresh token" })
  @ApiResponse({ status: 204, description: "Session revoked successfully" })
  async logout(@Body() body: any) {
    const parsed = refreshTokenRequestSchema.parse(body);
    await this.authService.logout(parsed.refreshToken);
  }

  @Get("me")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Retrieve authenticated user profile and active context" })
  @ApiResponse({ status: 200, description: "Current user profile" })
  async getMe(@Req() req: FastifyRequest) {
    const user = (req as any).user as RequestContext;
    return this.userService.getMe(user.userId);
  }

  @Post("switch-condominium")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Switch active condominium and update session token" })
  @ApiResponse({ status: 200, description: "New access token with active condominium" })
  async switchCondominium(@Body() body: any, @Req() req: FastifyRequest) {
    const parsed = switchCondominiumRequestSchema.parse(body);
    const user = (req as any).user as RequestContext;
    return this.authService.switchCondominium(user.userId, parsed.condominiumId);
  }
}
