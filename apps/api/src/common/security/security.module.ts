import { Global, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PasswordService } from "./password.service";
import { TokenService } from "./token.service";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { PermissionsGuard } from "../guards/permissions.guard";

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret:
          config.get<string>("JWT_ACCESS_SECRET") ||
          "super_secret_access_key_change_me_in_production_1234567890",
        signOptions: {
          expiresIn: config.get<string>("JWT_ACCESS_TTL") || "15m",
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    PasswordService,
    TokenService,
    JwtAuthGuard,
    PermissionsGuard,
  ],
  exports: [
    PasswordService,
    TokenService,
    JwtAuthGuard,
    PermissionsGuard,
    JwtModule,
  ],
})
export class SecurityModule {}
