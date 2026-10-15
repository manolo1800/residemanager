import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { UserRepository } from "../../infrastructure/repositories/user.repository";
import { PasswordService } from "../../../../common/security/password.service";
import { DatabaseService } from "../../../../common/database/database.service";
import { RequestContextStore } from "../../../../common/context/request-context";
import { users, userTenantRoles, roles, userCondominiumAccess } from "@sgc/database";
import { CreateUserRequest } from "@sgc/contracts";
import { eq, and, isNull } from "drizzle-orm";

@Injectable()
export class UserService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly passwordService: PasswordService,
    private readonly dbService: DatabaseService
  ) {}

  async getMe(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundException("Usuario no encontrado");
    }
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      locale: user.locale,
      status: user.status,
      isSuperAdmin: user.isSuperAdmin,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async listUsersForTenant(tenantId: string) {
    return this.dbService.db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        phone: users.phone,
        locale: users.locale,
        status: users.status,
        isSuperAdmin: users.isSuperAdmin,
        createdAt: users.createdAt,
      })
      .from(userTenantRoles)
      .innerJoin(users, eq(userTenantRoles.userId, users.id))
      .where(
        and(
          eq(userTenantRoles.tenantId, tenantId),
          isNull(users.deletedAt),
          isNull(userTenantRoles.deletedAt)
        )
      );
  }

  async createUser(dto: CreateUserRequest, tenantId?: string) {
    const currentTenantId = tenantId || RequestContextStore.get()?.tenantId;
    if (!currentTenantId) {
      throw new BadRequestException("Tenant context is required");
    }

    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException("El correo ya está registrado en el sistema");
    }

    const passwordHash = await this.passwordService.hash(dto.password);

    const [newUser] = await this.dbService.db
      .insert(users)
      .values({
        email: dto.email.toLowerCase().trim(),
        fullName: dto.fullName,
        passwordHash,
        phone: dto.phone || null,
        status: "active",
      })
      .returning();

    // Find role
    const [targetRole] = await this.dbService.db
      .select()
      .from(roles)
      .where(eq(roles.code, dto.roleCode));

    if (!targetRole) {
      throw new BadRequestException(`El rol '${dto.roleCode}' no existe`);
    }

    // Assign role on tenant
    await this.dbService.db.insert(userTenantRoles).values({
      userId: newUser.id,
      tenantId: currentTenantId,
      roleId: targetRole.id,
    });

    // If condominium was provided, assign access
    if (dto.condominiumId) {
      await this.dbService.db.insert(userCondominiumAccess).values({
        userId: newUser.id,
        condominiumId: dto.condominiumId,
        roleId: targetRole.id,
      });
    }

    return {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      phone: newUser.phone,
      locale: newUser.locale,
      status: newUser.status,
      isSuperAdmin: newUser.isSuperAdmin,
      createdAt: newUser.createdAt.toISOString(),
    };
  }
}
