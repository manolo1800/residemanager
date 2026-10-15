import { Module } from "@nestjs/common";
import { IdentityFacade } from "./identity.facade";
import { AuthService } from "./application/services/auth.service";
import { UserService } from "./application/services/user.service";
import { TenantService } from "./application/services/tenant.service";
import { UserRepository } from "./infrastructure/repositories/user.repository";
import { SessionRepository } from "./infrastructure/repositories/session.repository";
import { TenantRepository } from "./infrastructure/repositories/tenant.repository";
import { AuthController } from "./presentation/controllers/auth.controller";
import { TenantController } from "./presentation/controllers/tenant.controller";
import { UserController } from "./presentation/controllers/user.controller";

@Module({
  controllers: [AuthController, TenantController, UserController],
  providers: [
    IdentityFacade,
    AuthService,
    UserService,
    TenantService,
    UserRepository,
    SessionRepository,
    TenantRepository,
  ],
  exports: [IdentityFacade],
})
export class IdentityModule {}
