import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PERMISSIONS_KEY } from "../decorators/permissions.decorator";
import { RequestContext } from "../context/request-context";
import { FastifyRequest } from "fastify";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const user = (request as any).user as RequestContext | undefined;

    if (!user) {
      throw new ForbiddenException("No authenticated user context");
    }

    // SuperAdmin bypasses permission checks
    if (user.isSuperAdmin) {
      return true;
    }

    const hasAll = requiredPermissions.every((perm) =>
      user.permissions.has(perm)
    );

    if (!hasAll) {
      throw new ForbiddenException(
        `Insufficient permissions. Required: ${requiredPermissions.join(", ")}`
      );
    }

    return true;
  }
}
