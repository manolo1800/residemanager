import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { TokenService } from "../security/token.service";
import { RequestContext, RequestContextStore } from "../context/request-context";
import { FastifyRequest } from "fastify";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenService: TokenService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing or invalid Authorization header");
    }

    const token = authHeader.substring(7);

    try {
      const payload = await this.tokenService.verifyAccessToken(token);

      // Support condominium switch via header
      const headerCondoId = request.headers["x-condominium-id"] as string | undefined;
      const activeCondoId = headerCondoId || payload.activeCondominiumId;

      const requestContext: RequestContext = {
        userId: payload.sub,
        tenantId: payload.tenantId,
        activeCondominiumId: activeCondoId,
        roles: payload.roles,
        permissions: new Set(payload.permissions),
        email: payload.email,
        isSuperAdmin: payload.isSuperAdmin,
        requestId: (request.id as string) || "req",
        ip: request.ip,
        userAgent: request.headers["user-agent"],
      };

      // Attach context to request object and AsyncLocalStorage
      (request as any).user = requestContext;
      RequestContextStore.enterWith(requestContext);

      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired access token");
    }
  }
}
