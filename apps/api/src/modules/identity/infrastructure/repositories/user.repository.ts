import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../../../common/database/database.service";
import { users, userTenantRoles, userCondominiumAccess, roles, permissions, rolePermissions } from "@sgc/database";
import { eq, and, isNull } from "drizzle-orm";

@Injectable()
export class UserRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async findByEmail(email: string) {
    const results = await this.dbService.db
      .select()
      .from(users)
      .where(and(eq(users.email, email.toLowerCase().trim()), isNull(users.deletedAt)));
    return results[0] || null;
  }

  async findById(id: string) {
    const results = await this.dbService.db
      .select()
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)));
    return results[0] || null;
  }

  async getUserTenantsAndRoles(userId: string) {
    const tenantRoles = await this.dbService.db
      .select({
        tenantId: userTenantRoles.tenantId,
        roleId: userTenantRoles.roleId,
        roleCode: roles.code,
      })
      .from(userTenantRoles)
      .innerJoin(roles, eq(userTenantRoles.roleId, roles.id))
      .where(
        and(
          eq(userTenantRoles.userId, userId),
          eq(userTenantRoles.status, "active"),
          isNull(userTenantRoles.deletedAt)
        )
      );

    return tenantRoles;
  }

  async getUserCondominiums(userId: string) {
    const condoAccess = await this.dbService.db
      .select({
        condominiumId: userCondominiumAccess.condominiumId,
        roleId: userCondominiumAccess.roleId,
        roleCode: roles.code,
      })
      .from(userCondominiumAccess)
      .innerJoin(roles, eq(userCondominiumAccess.roleId, roles.id))
      .where(
        and(
          eq(userCondominiumAccess.userId, userId),
          eq(userCondominiumAccess.status, "active"),
          isNull(userCondominiumAccess.deletedAt)
        )
      );

    return condoAccess;
  }

  async getPermissionsForRoles(roleIds: string[]): Promise<string[]> {
    if (roleIds.length === 0) return [];

    const perms = await this.dbService.db
      .select({
        module: permissions.module,
        action: permissions.action,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, roleIds[0])); // Can expand for all roleIds

    return perms.map((p) => `${p.module}:${p.action}`);
  }
}
