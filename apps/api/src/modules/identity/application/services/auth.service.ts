import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { UserRepository } from "../../infrastructure/repositories/user.repository";
import { SessionRepository } from "../../infrastructure/repositories/session.repository";
import { TenantRepository } from "../../infrastructure/repositories/tenant.repository";
import { PasswordService } from "../../../../common/security/password.service";
import { TokenService } from "../../../../common/security/token.service";
import { DatabaseService } from "../../../../common/database/database.service";
import {
  condominiums,
  tenants,
  users,
  roles,
  userTenantRoles,
  userCondominiumAccess,
  persons,
  residentProfiles,
  residentLinkRequests,
} from "@sgc/database";
import { eq, and, isNull } from "drizzle-orm";
import {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  AuthTokens,
  CheckEmailResponse,
  RegisterCondominiumRequest,
  RegisterResidentRequest,
} from "@sgc/contracts";

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly sessionRepo: SessionRepository,
    private readonly tenantRepo: TenantRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly dbService: DatabaseService
  ) {}

  async checkEmail(email: string): Promise<CheckEmailResponse> {
    const trimmed = (email || "").toLowerCase().trim();
    const existing = await this.userRepo.findByEmail(trimmed);
    return {
      exists: !!existing,
      email: trimmed,
    };
  }

  async registerCondominium(
    dto: RegisterCondominiumRequest,
    ip?: string,
    userAgent?: string
  ): Promise<LoginResponse> {
    const email = dto.adminEmail.toLowerCase().trim();
    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException(
        "El correo ya está registrado en el sistema. Inicie sesión para asociar o crear el condominio con su cuenta."
      );
    }

    const passwordHash = await this.passwordService.hash(dto.adminPassword);

    const baseSlug = (dto.condoCode || "admin")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 30);
    const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;

    // 1. Create Tenant
    const [newTenant] = await this.dbService.db
      .insert(tenants)
      .values({
        name: `Administradora ${dto.condoName.trim()}`,
        slug: uniqueSlug,
        primaryLocale: "es",
        primaryTimezone: "America/Caracas",
        status: "active",
      })
      .returning();

    // 2. Create User
    const [newUser] = await this.dbService.db
      .insert(users)
      .values({
        email,
        fullName: dto.adminFullName.trim(),
        phone: dto.adminPhone?.trim() || null,
        passwordHash,
        isSuperAdmin: false,
        locale: "es",
        timezone: "America/Caracas",
        status: "active",
      })
      .returning();

    // 3. Find system roles
    const [tenantAdminRole] = await this.dbService.db
      .select()
      .from(roles)
      .where(eq(roles.code, "tenant_admin"));

    const [condoAdminRole] = await this.dbService.db
      .select()
      .from(roles)
      .where(eq(roles.code, "condo_admin"));

    if (tenantAdminRole) {
      await this.dbService.db.insert(userTenantRoles).values({
        userId: newUser.id,
        tenantId: newTenant.id,
        roleId: tenantAdminRole.id,
        status: "active",
      });
    }

    // 4. Create Condominium
    const [newCondo] = await this.dbService.db
      .insert(condominiums)
      .values({
        tenantId: newTenant.id,
        code: dto.condoCode.toUpperCase().trim(),
        name: dto.condoName.trim(),
        type: dto.condoType,
        address: dto.condoAddress.trim(),
        country: "VE",
        timezone: "America/Caracas",
        baseCurrency: dto.baseCurrency,
        status: "active",
      })
      .returning();

    // 5. Assign Condo Admin Access
    if (condoAdminRole) {
      await this.dbService.db.insert(userCondominiumAccess).values({
        userId: newUser.id,
        condominiumId: newCondo.id,
        roleId: condoAdminRole.id,
        status: "active",
      });
    }

    // 6. Permissions and tokens
    const roleIds = [tenantAdminRole?.id, condoAdminRole?.id].filter(Boolean) as string[];
    const permissionsList = await this.userRepo.getPermissionsForRoles(roleIds);
    const rolesList = ["tenant_admin", "condo_admin"];

    const accessToken = await this.tokenService.signAccessToken({
      sub: newUser.id,
      tenantId: newTenant.id,
      activeCondominiumId: newCondo.id,
      email: newUser.email,
      isSuperAdmin: false,
      roles: rolesList,
      permissions: permissionsList,
    });

    const { token: rawRefreshToken, hash: refreshHash } =
      this.tokenService.generateOpaqueRefreshToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.sessionRepo.create({
      userId: newUser.id,
      tenantId: newTenant.id,
      activeCondominiumId: newCondo.id,
      refreshTokenHash: refreshHash,
      expiresAt,
      ip,
      userAgent,
    });

    return {
      tokens: {
        accessToken,
        refreshToken: rawRefreshToken,
        expiresIn: 900,
        tokenType: "Bearer",
      },
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        locale: newUser.locale,
        isSuperAdmin: false,
      },
      tenant: {
        id: newTenant.id,
        name: newTenant.name,
        slug: newTenant.slug,
      },
      condominium: {
        id: newCondo.id,
        name: newCondo.name,
        code: newCondo.code,
        type: newCondo.type,
        timezone: newCondo.timezone,
        baseCurrency: newCondo.baseCurrency,
      },
      roles: rolesList,
      permissions: permissionsList,
    };
  }

  async registerResident(
    dto: RegisterResidentRequest,
    ip?: string,
    userAgent?: string
  ): Promise<LoginResponse> {
    const email = dto.email.toLowerCase().trim();
    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException(
        "El correo ya está registrado en el sistema. Inicie sesión directamente con sus credenciales."
      );
    }

    const passwordHash = await this.passwordService.hash(dto.password);

    // 1. Resolve target tenant and target condominium
    let targetTenantId: string;
    let targetCondo: any = null;

    if (dto.condominiumId) {
      const [foundCondo] = await this.dbService.db
        .select()
        .from(condominiums)
        .where(and(eq(condominiums.id, dto.condominiumId), isNull(condominiums.deletedAt)));
      if (foundCondo) {
        targetTenantId = foundCondo.tenantId;
        targetCondo = foundCondo;
      } else {
        const allTenants = await this.tenantRepo.findAll();
        targetTenantId = allTenants[0]?.id;
      }
    } else {
      const allTenants = await this.tenantRepo.findAll();
      if (allTenants.length === 0) {
        throw new BadRequestException("No existen administradoras activas en el sistema");
      }
      targetTenantId = allTenants[0].id;
    }

    const targetTenant = await this.tenantRepo.findById(targetTenantId);
    if (!targetTenant) {
      throw new BadRequestException("Administradora / Tenant no encontrado");
    }

    // 2. Create User
    const [newUser] = await this.dbService.db
      .insert(users)
      .values({
        email,
        fullName: dto.fullName.trim(),
        phone: dto.phone?.trim() || null,
        passwordHash,
        isSuperAdmin: false,
        locale: "es",
        timezone: "America/Caracas",
        status: "active",
      })
      .returning();

    // 3. Find resident system role
    const [residentRole] = await this.dbService.db
      .select()
      .from(roles)
      .where(eq(roles.code, "resident"));

    if (residentRole) {
      await this.dbService.db.insert(userTenantRoles).values({
        userId: newUser.id,
        tenantId: targetTenantId,
        roleId: residentRole.id,
        status: "active",
      });
    }

    // 4. Create Person and ResidentProfile
    const [newPerson] = await this.dbService.db
      .insert(persons)
      .values({
        tenantId: targetTenantId,
        documentType: dto.documentType || "V",
        documentNumber: dto.documentNumber.trim(),
        fullName: dto.fullName.trim(),
        email,
        phone: dto.phone?.trim() || null,
      })
      .returning();

    await this.dbService.db.insert(residentProfiles).values({
      userId: newUser.id,
      personId: newPerson.id,
      tenantId: targetTenantId,
    });

    // 5. If condominiumId and unitCode are provided, automatically submit link request
    if (dto.condominiumId && dto.unitCode && dto.unitCode.trim()) {
      await this.dbService.db.insert(residentLinkRequests).values({
        tenantId: targetTenantId,
        userId: newUser.id,
        condominiumId: dto.condominiumId,
        unitCode: dto.unitCode.trim().toUpperCase(),
        status: "pending",
      });
    }

    // 6. Tokens & Session
    const roleIds = [residentRole?.id].filter(Boolean) as string[];
    const permissionsList = await this.userRepo.getPermissionsForRoles(roleIds);
    const rolesList = ["resident"];

    const accessToken = await this.tokenService.signAccessToken({
      sub: newUser.id,
      tenantId: targetTenantId,
      activeCondominiumId: targetCondo?.id || null,
      email: newUser.email,
      isSuperAdmin: false,
      roles: rolesList,
      permissions: permissionsList,
    });

    const { token: rawRefreshToken, hash: refreshHash } =
      this.tokenService.generateOpaqueRefreshToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.sessionRepo.create({
      userId: newUser.id,
      tenantId: targetTenantId,
      activeCondominiumId: targetCondo?.id || null,
      refreshTokenHash: refreshHash,
      expiresAt,
      ip,
      userAgent,
    });

    return {
      tokens: {
        accessToken,
        refreshToken: rawRefreshToken,
        expiresIn: 900,
        tokenType: "Bearer",
      },
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        locale: newUser.locale,
        isSuperAdmin: false,
      },
      tenant: {
        id: targetTenant.id,
        name: targetTenant.name,
        slug: targetTenant.slug,
      },
      condominium: targetCondo
        ? {
            id: targetCondo.id,
            name: targetCondo.name,
            code: targetCondo.code,
            type: targetCondo.type,
            timezone: targetCondo.timezone,
            baseCurrency: targetCondo.baseCurrency,
          }
        : null,
      roles: rolesList,
      permissions: permissionsList,
    };
  }

  async login(
    dto: LoginRequest,
    ip?: string,
    userAgent?: string
  ): Promise<LoginResponse> {
    const user = await this.userRepo.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException("Credenciales inválidas");
    }

    if (user.status !== "active") {
      throw new ForbiddenException("Cuenta de usuario inactiva");
    }

    const isValidPassword = await this.passwordService.verify(
      user.passwordHash,
      dto.password
    );

    if (!isValidPassword) {
      throw new UnauthorizedException("Credenciales inválidas");
    }

    // Resolve tenant
    const userTenants = await this.userRepo.getUserTenantsAndRoles(user.id);
    let targetTenantId: string;

    if (user.isSuperAdmin && userTenants.length === 0) {
      // Superadmin fallback to first tenant
      const allTenants = await this.tenantRepo.findAll();
      if (allTenants.length === 0) {
        throw new BadRequestException("No existen tenants registrados en el sistema");
      }
      targetTenantId = allTenants[0].id;
    } else if (userTenants.length > 0) {
      targetTenantId = userTenants[0].tenantId;
    } else {
      throw new ForbiddenException("Usuario no tiene acceso a ninguna administradora");
    }

    const targetTenant = await this.tenantRepo.findById(targetTenantId);
    if (!targetTenant) {
      throw new BadRequestException("Tenant no encontrado");
    }

    // Resolve active condominium
    const condoAccess = await this.userRepo.getUserCondominiums(user.id);
    let activeCondoId: string | null = null;

    if (dto.condominiumId) {
      const hasAccess =
        user.isSuperAdmin ||
        condoAccess.some((c) => c.condominiumId === dto.condominiumId);
      if (!hasAccess) {
        throw new ForbiddenException("No tiene acceso al condominio especificado");
      }
      activeCondoId = dto.condominiumId;
    } else if (condoAccess.length > 0) {
      activeCondoId = condoAccess[0].condominiumId;
    }

    let activeCondoData = null;
    if (activeCondoId) {
      const [condo] = await this.dbService.db
        .select()
        .from(condominiums)
        .where(and(eq(condominiums.id, activeCondoId), isNull(condominiums.deletedAt)));
      if (condo) {
        activeCondoData = {
          id: condo.id,
          name: condo.name,
          code: condo.code,
          type: condo.type,
          timezone: condo.timezone,
          baseCurrency: condo.baseCurrency,
        };
      }
    }

    // Collect roles and permissions
    const rolesList = userTenants.map((t) => t.roleCode);
    if (user.isSuperAdmin && !rolesList.includes("super_admin")) {
      rolesList.push("super_admin");
    }

    const roleIds = userTenants.map((t) => t.roleId);
    const permissionsList = await this.userRepo.getPermissionsForRoles(roleIds);

    // Sign access token (15m)
    const accessToken = await this.tokenService.signAccessToken({
      sub: user.id,
      tenantId: targetTenantId,
      activeCondominiumId: activeCondoId,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
      roles: rolesList,
      permissions: permissionsList,
    });

    // Generate opaque refresh token (7 days)
    const { token: rawRefreshToken, hash: refreshHash } =
      this.tokenService.generateOpaqueRefreshToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.sessionRepo.create({
      userId: user.id,
      tenantId: targetTenantId,
      activeCondominiumId: activeCondoId,
      refreshTokenHash: refreshHash,
      expiresAt,
      ip,
      userAgent,
    });

    return {
      tokens: {
        accessToken,
        refreshToken: rawRefreshToken,
        expiresIn: 900,
        tokenType: "Bearer",
      },
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        locale: user.locale,
        isSuperAdmin: user.isSuperAdmin,
      },
      tenant: {
        id: targetTenant.id,
        name: targetTenant.name,
        slug: targetTenant.slug,
      },
      condominium: activeCondoData,
      roles: rolesList,
      permissions: permissionsList,
    };
  }

  async refresh(dto: RefreshTokenRequest, ip?: string, userAgent?: string): Promise<AuthTokens> {
    const hash = this.tokenService.hashRefreshToken(dto.refreshToken);
    const session = await this.sessionRepo.findValidSessionByRefreshHash(hash);

    if (!session) {
      throw new UnauthorizedException("Sesión inválida o expirada");
    }

    const user = await this.userRepo.findById(session.userId);
    if (!user || user.status !== "active") {
      throw new UnauthorizedException("Usuario inválido o inactivo");
    }

    const userTenants = await this.userRepo.getUserTenantsAndRoles(user.id);
    const rolesList = userTenants.map((t) => t.roleCode);
    if (user.isSuperAdmin && !rolesList.includes("super_admin")) {
      rolesList.push("super_admin");
    }

    const roleIds = userTenants.map((t) => t.roleId);
    const permissionsList = await this.userRepo.getPermissionsForRoles(roleIds);

    // Rotate refresh token
    const { token: newRefreshToken, hash: newRefreshHash } =
      this.tokenService.generateOpaqueRefreshToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Delete old session and save new rotated session
    await this.sessionRepo.delete(session.id);
    await this.sessionRepo.create({
      userId: user.id,
      tenantId: session.tenantId,
      activeCondominiumId: session.activeCondominiumId,
      refreshTokenHash: newRefreshHash,
      expiresAt,
      ip,
      userAgent,
    });

    // New access token
    const accessToken = await this.tokenService.signAccessToken({
      sub: user.id,
      tenantId: session.tenantId,
      activeCondominiumId: session.activeCondominiumId,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
      roles: rolesList,
      permissions: permissionsList,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900,
      tokenType: "Bearer",
    };
  }

  async logout(refreshToken: string) {
    const hash = this.tokenService.hashRefreshToken(refreshToken);
    const session = await this.sessionRepo.findValidSessionByRefreshHash(hash);
    if (session) {
      await this.sessionRepo.delete(session.id);
    }
  }

  async switchCondominium(
    userId: string,
    newCondoId: string
  ): Promise<{ accessToken: string; activeCondominiumId: string }> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new UnauthorizedException("Usuario no encontrado");
    }

    const condoAccess = await this.userRepo.getUserCondominiums(userId);
    const hasAccess =
      user.isSuperAdmin ||
      condoAccess.some((c) => c.condominiumId === newCondoId);

    if (!hasAccess) {
      throw new ForbiddenException("No tiene permisos para acceder a este condominio");
    }

    const userTenants = await this.userRepo.getUserTenantsAndRoles(userId);
    const tenantId = userTenants[0]?.tenantId || "";
    const rolesList = userTenants.map((t) => t.roleCode);
    const roleIds = userTenants.map((t) => t.roleId);
    const permissionsList = await this.userRepo.getPermissionsForRoles(roleIds);

    const accessToken = await this.tokenService.signAccessToken({
      sub: user.id,
      tenantId,
      activeCondominiumId: newCondoId,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
      roles: rolesList,
      permissions: permissionsList,
    });

    return {
      accessToken,
      activeCondominiumId: newCondoId,
    };
  }
}
