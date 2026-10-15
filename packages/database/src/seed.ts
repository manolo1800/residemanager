import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import * as argon2 from "argon2";
import { eq } from "drizzle-orm";

const connectionString =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/sgc";

const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function seed() {
  console.log("🌱 Starting seed...");

  // 1. Permissions
  const permissionsList = [
    // Identity
    { module: "identity", action: "user.list", description: "List users" },
    { module: "identity", action: "user.create", description: "Create user" },
    { module: "identity", action: "user.update", description: "Update user" },
    { module: "identity", action: "user.invite", description: "Invite user" },
    { module: "identity", action: "user.deactivate", description: "Deactivate user" },
    { module: "identity", action: "tenant.list", description: "List tenants" },
    { module: "identity", action: "tenant.create", description: "Create tenant" },
    { module: "identity", action: "tenant.update", description: "Update tenant" },
    { module: "identity", action: "role.list", description: "List roles" },
    { module: "identity", action: "permission.list", description: "List permissions" },
    { module: "identity", action: "session.revoke", description: "Revoke sessions" },
    // Condominiums
    { module: "condominiums", action: "read", description: "View condominiums" },
    { module: "condominiums", action: "create", description: "Create condominium" },
    { module: "condominiums", action: "update", description: "Update condominium" },
    { module: "condominiums", action: "switch", description: "Switch active condominium" },
    { module: "condominiums", action: "condo.list", description: "List condominiums" },
    { module: "condominiums", action: "condo.create", description: "Create condominium" },
    { module: "condominiums", action: "condo.read", description: "Read condominium detail" },
    { module: "condominiums", action: "condo.update", description: "Update condominium" },
    { module: "condominiums", action: "condo.deactivate", description: "Deactivate condominium" },
    { module: "condominiums", action: "structure.list", description: "List structures" },
    { module: "condominiums", action: "structure.create", description: "Create structure" },
    { module: "condominiums", action: "structure.update", description: "Update structure" },
    { module: "condominiums", action: "structure.delete", description: "Delete structure" },
    { module: "condominiums", action: "unit.list", description: "List units" },
    { module: "condominiums", action: "unit.create", description: "Create unit" },
    { module: "condominiums", action: "unit.update", description: "Update unit" },
    { module: "condominiums", action: "unit.delete", description: "Delete unit" },
    { module: "condominiums", action: "unit.import", description: "Import units via CSV" },
    { module: "condominiums", action: "area.list", description: "List common areas" },
    { module: "condominiums", action: "area.create", description: "Create common area" },
    { module: "condominiums", action: "area.update", description: "Update common area" },
    { module: "condominiums", action: "area.delete", description: "Delete common area" },
    { module: "condominiums", action: "parking.list", description: "List parking spots" },
    { module: "condominiums", action: "parking.create", description: "Create parking spot" },
    { module: "condominiums", action: "parking.update", description: "Update parking spot" },
    { module: "condominiums", action: "parking.delete", description: "Delete parking spot" },
    { module: "condominiums", action: "settings.update", description: "Update operational settings" },
    // Properties & Residents (M03)
    { module: "properties", action: "person.list", description: "List persons" },
    { module: "properties", action: "person.create", description: "Create person" },
    { module: "properties", action: "person.update", description: "Update person" },
    { module: "properties", action: "ownership.list", description: "List unit ownerships" },
    { module: "properties", action: "ownership.create", description: "Assign owner to unit" },
    { module: "properties", action: "transfer.create", description: "Create ownership transfer" },
    { module: "properties", action: "transfer.approve", description: "Approve ownership transfer" },
    { module: "properties", action: "transfer.reject", description: "Reject ownership transfer" },
    { module: "residents", action: "link.list", description: "List resident link requests" },
    { module: "residents", action: "link.create", description: "Create resident link request" },
    { module: "residents", action: "link.approve", description: "Approve resident link request" },
    { module: "residents", action: "link.reject", description: "Reject resident link request" },
    { module: "residents", action: "properties.list", description: "List my properties" },
  ];

  for (const perm of permissionsList) {
    const existing = await db
      .select()
      .from(schema.permissions)
      .where(eq(schema.permissions.module, perm.module));
    const found = existing.find((p) => p.action === perm.action);
    if (!found) {
      await db.insert(schema.permissions).values(perm);
    }
  }


  // 2. System Roles
  const systemRoles = [
    { code: "super_admin", name: "Super Administrador", description: "Acceso global al SaaS", isSystem: true },
    { code: "tenant_admin", name: "Admin de Tenant", description: "Dueño de administradora", isSystem: true },
    { code: "condo_admin", name: "Admin de Condominio", description: "Administrador de residencia", isSystem: true },
    { code: "board_member", name: "Junta de Condominio", description: "Miembro de junta", isSystem: true },
    { code: "resident", name: "Residente / Propietario", description: "Habitante de unidad", isSystem: true },
    { code: "accountant", name: "Contador / Auditor", description: "Auditor financiero", isSystem: true },
    { code: "staff", name: "Personal", description: "Trabajador", isSystem: true },
  ];

  for (const r of systemRoles) {
    const existing = await db
      .select()
      .from(schema.roles)
      .where(eq(schema.roles.code, r.code));
    if (existing.length === 0) {
      await db.insert(schema.roles).values(r);
    }
  }

  // 2.1 Assign permissions to roles
  const allPermissions = await db.select().from(schema.permissions);
  const allRoles = await db.select().from(schema.roles);
  const superAdminRole = allRoles.find((r) => r.code === "super_admin");
  const tenantAdminRole = allRoles.find((r) => r.code === "tenant_admin");
  const condoAdminRole = allRoles.find((r) => r.code === "condo_admin");
  const residentRole = allRoles.find((r) => r.code === "resident");
  const boardMemberRole = allRoles.find((r) => r.code === "board_member");

  for (const perm of allPermissions) {
    // SuperAdmin gets all permissions
    if (superAdminRole) {
      await db
        .insert(schema.rolePermissions)
        .values({ roleId: superAdminRole.id, permissionId: perm.id })
        .onConflictDoNothing();
    }
    // TenantAdmin gets all condominium, properties, residents, and identity perms
    if (tenantAdminRole) {
      if (
        perm.module === "condominiums" ||
        perm.module === "properties" ||
        perm.module === "residents" ||
        (perm.module === "identity" && !perm.action.startsWith("tenant."))
      ) {
        await db
          .insert(schema.rolePermissions)
          .values({ roleId: tenantAdminRole.id, permissionId: perm.id })
          .onConflictDoNothing();
      }
    }
    // CondoAdmin gets condominium, properties, residents, and user list/create
    if (condoAdminRole) {
      if (
        perm.module === "condominiums" ||
        perm.module === "properties" ||
        perm.module === "residents" ||
        (perm.module === "identity" && ["user.list", "user.create", "role.list"].includes(perm.action))
      ) {
        await db
          .insert(schema.rolePermissions)
          .values({ roleId: condoAdminRole.id, permissionId: perm.id })
          .onConflictDoNothing();
      }
    }
    // Resident gets link.create and properties.list
    if (residentRole) {
      if (
        (perm.module === "residents" && ["link.create", "properties.list"].includes(perm.action)) ||
        (perm.module === "condominiums" && perm.action === "read")
      ) {
        await db
          .insert(schema.rolePermissions)
          .values({ roleId: residentRole.id, permissionId: perm.id })
          .onConflictDoNothing();
      }
    }
    // Board member gets read perms
    if (boardMemberRole) {
      if (
        (perm.module === "properties" && ["person.list", "ownership.list"].includes(perm.action)) ||
        (perm.module === "condominiums" && perm.action === "read")
      ) {
        await db
          .insert(schema.rolePermissions)
          .values({ roleId: boardMemberRole.id, permissionId: perm.id })
          .onConflictDoNothing();
      }
    }
  }

  // 3. Demo Tenant
  const existingTenant = await db
    .select()
    .from(schema.tenants)
    .where(eq(schema.tenants.slug, "demo"));
  let demoTenantId: string;
  if (existingTenant.length === 0) {
    const [inserted] = await db
      .insert(schema.tenants)
      .values({
        name: "Administradora Demo SGC",
        slug: "demo",
        primaryLocale: "es",
        primaryTimezone: "America/Caracas",
        status: "active",
      })
      .returning();
    demoTenantId = inserted.id;
  } else {
    demoTenantId = existingTenant[0].id;
  }

  // 4. Demo Condominium
  const existingCondo = await db
    .select()
    .from(schema.condominiums)
    .where(eq(schema.condominiums.code, "RES-AVILA"));
  let demoCondoId: string;
  if (existingCondo.length === 0) {
    const [inserted] = await db
      .insert(schema.condominiums)
      .values({
        tenantId: demoTenantId,
        code: "RES-AVILA",
        name: "Residencias El Ávila",
        type: "buildings",
        address: "Av. Principal Los Palos Grandes",
        country: "VE",
        timezone: "America/Caracas",
        baseCurrency: "USD",
        branding: {
          primaryColor: "#2E6DA4",
          secondaryColor: "#64748B",
        },
      })
      .returning();
    demoCondoId = inserted.id;
  } else {
    demoCondoId = existingCondo[0].id;
  }

  // 5. SuperAdmin User
  const adminEmail = "admin@sgc.app";
  const existingUser = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, adminEmail));
  let superUserId: string;
  if (existingUser.length === 0) {
    const passwordHash = await argon2.hash("Admin1234*!", {
      type: argon2.argon2id,
    });
    const [inserted] = await db
      .insert(schema.users)
      .values({
        email: adminEmail,
        fullName: "Super Administrador SGC",
        passwordHash,
        isSuperAdmin: true,
        locale: "es",
        status: "active",
      })
      .returning();
    superUserId = inserted.id;

    // Assign super_admin role on demo tenant
    const superAdminRole = await db
      .select()
      .from(schema.roles)
      .where(eq(schema.roles.code, "super_admin"));
    if (superAdminRole.length > 0) {
      await db.insert(schema.userTenantRoles).values({
        userId: superUserId,
        tenantId: demoTenantId,
        roleId: superAdminRole[0].id,
      });

      await db.insert(schema.userCondominiumAccess).values({
        userId: superUserId,
        condominiumId: demoCondoId,
        roleId: superAdminRole[0].id,
      });
    }
  }

  // 6. Demo Physical Structures (condo_structures)
  const existingStructures = await db
    .select()
    .from(schema.condoStructures)
    .where(eq(schema.condoStructures.condominiumId, demoCondoId));
  let torreAId: string;
  let torreBId: string;

  if (existingStructures.length === 0) {
    const [torreA] = await db
      .insert(schema.condoStructures)
      .values({
        tenantId: demoTenantId,
        condominiumId: demoCondoId,
        name: "Torre A",
        kind: "building",
        floors: 10,
        position: 1,
      })
      .returning();
    torreAId = torreA.id;

    const [torreB] = await db
      .insert(schema.condoStructures)
      .values({
        tenantId: demoTenantId,
        condominiumId: demoCondoId,
        name: "Torre B",
        kind: "building",
        floors: 10,
        position: 2,
      })
      .returning();
    torreBId = torreB.id;
  } else {
    torreAId = existingStructures[0].id;
    torreBId = existingStructures[1]?.id || existingStructures[0].id;
  }

  // 7. Demo Units
  const existingUnits = await db
    .select()
    .from(schema.units)
    .where(eq(schema.units.condominiumId, demoCondoId));

  if (existingUnits.length === 0) {
    await db.insert(schema.units).values([
      {
        tenantId: demoTenantId,
        condominiumId: demoCondoId,
        structureId: torreAId,
        code: "1-A",
        floor: 1,
        type: "apartment",
        areaM2: "115.50",
        aliquotPct: "2.500",
        status: "active",
      },
      {
        tenantId: demoTenantId,
        condominiumId: demoCondoId,
        structureId: torreAId,
        code: "1-B",
        floor: 1,
        type: "apartment",
        areaM2: "115.50",
        aliquotPct: "2.500",
        status: "active",
      },
      {
        tenantId: demoTenantId,
        condominiumId: demoCondoId,
        structureId: torreAId,
        code: "2-A",
        floor: 2,
        type: "apartment",
        areaM2: "120.00",
        aliquotPct: "2.600",
        status: "active",
      },
      {
        tenantId: demoTenantId,
        condominiumId: demoCondoId,
        structureId: torreBId,
        code: "1-A",
        floor: 1,
        type: "apartment",
        areaM2: "110.00",
        aliquotPct: "2.400",
        status: "active",
      },
    ]);
  }

  // 8. Demo Common Areas
  const existingAreas = await db
    .select()
    .from(schema.commonAreas)
    .where(eq(schema.commonAreas.condominiumId, demoCondoId));

  if (existingAreas.length === 0) {
    await db.insert(schema.commonAreas).values([
      {
        tenantId: demoTenantId,
        condominiumId: demoCondoId,
        name: "Piscina Climatizada",
        type: "pool",
        capacity: 40,
      },
      {
        tenantId: demoTenantId,
        condominiumId: demoCondoId,
        name: "Salón de Fiestas y Eventos",
        type: "party_room",
        capacity: 100,
      },
      {
        tenantId: demoTenantId,
        condominiumId: demoCondoId,
        name: "Gimnasio Techado",
        type: "gym",
        capacity: 25,
      },
    ]);
  }

  // 9. Demo Parking Spots
  const existingParking = await db
    .select()
    .from(schema.parkingSpots)
    .where(eq(schema.parkingSpots.condominiumId, demoCondoId));

  if (existingParking.length === 0) {
    const unitsList = await db
      .select()
      .from(schema.units)
      .where(eq(schema.units.condominiumId, demoCondoId));

    await db.insert(schema.parkingSpots).values([
      {
        tenantId: demoTenantId,
        condominiumId: demoCondoId,
        code: "E-01",
        type: "resident",
        assignedUnitId: unitsList[0]?.id || null,
      },
      {
        tenantId: demoTenantId,
        condominiumId: demoCondoId,
        code: "E-02",
        type: "resident",
        assignedUnitId: unitsList[1]?.id || null,
      },
      {
        tenantId: demoTenantId,
        condominiumId: demoCondoId,
        code: "V-01",
        type: "visitor",
      },
      {
        tenantId: demoTenantId,
        condominiumId: demoCondoId,
        code: "V-02",
        type: "visitor",
      },
    ]);
  }


  console.log("✅ Seed completed successfully!");
  console.log(`👤 Admin: ${adminEmail} (password: Admin1234*!)`);
  console.log(`🏢 Tenant: Administradora Demo SGC (${demoTenantId})`);
  console.log(`🏠 Condominium: Residencias El Ávila (${demoCondoId})`);

  await client.end();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
