import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";

export interface JwtPayload {
  sub: string;
  tenantId: string;
  activeCondominiumId: string | null;
  email: string;
  isSuperAdmin: boolean;
  roles: string[];
  permissions: string[];
}

@Injectable()
export class TokenService {
  private readonly accessSecret: string;
  private readonly accessTtl: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {
    this.accessSecret =
      this.configService.get<string>("JWT_ACCESS_SECRET") ||
      "super_secret_access_key_change_me_in_production_1234567890";
    this.accessTtl = this.configService.get<string>("JWT_ACCESS_TTL") || "15m";
  }

  async signAccessToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.accessSecret,
      expiresIn: this.accessTtl,
    });
  }

  async verifyAccessToken(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync<JwtPayload>(token, {
      secret: this.accessSecret,
    });
  }

  generateOpaqueRefreshToken(): { token: string; hash: string } {
    const token = crypto.randomBytes(32).toString("hex");
    const hash = crypto.createHash("sha256").update(token).digest("hex");
    return { token, hash };
  }

  hashRefreshToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }
}
