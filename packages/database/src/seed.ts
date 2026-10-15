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
    // Billing (M06)
    { module: "billing", action: "fee.list", description: "List fee plans" },
    { module: "billing", action: "fee.create", description: "Create fee plan" },
    { module: "billing", action: "fee.update", description: "Update fee plan" },
    { module: "billing", action: "fee.cancel", description: "Cancel fee plan" },
    { module: "billing", action: "charge.list", description: "List unit charges" },
    { module: "billing", action: "charge.generate", description: "Generate monthly unit charges" },
    { module: "billing", action: "statement.read", description: "Read unit statement" },
    { module: "billing", action: "morosity.read", description: "Read morosity panel" },
    { module: "billing", action: "mora.list", description: "List mora rules" },
    { module: "billing", action: "mora.create", description: "Create mora rule" },
    { module: "billing", action: "rate.list", description: "List currency rates" },
    { module: "billing", action: "rate.create", description: "Create currency rate" },
    // Payments (M07)
    { module: "payments", action: "method.list", description: "List payment methods" },
    { module: "payments", action: "method.create", description: "Create payment method" },
    { module: "payments", action: "method.update", description: "Update payment method" },
    { module: "payments", action: "payment.list", description: "List payments" },
    { module: "payments", action: "payment.read", description: "Read payment detail" },
    { module: "payments", action: "payment.create", description: "Create payment" },
    { module: "payments", action: "payment.register_admin", description: "Admin register payment" },
    { module: "payments", action: "payment.approve", description: "Approve payment" },
    { module: "payments", action: "payment.reject", description: "Reject payment" },
    { module: "payments", action: "payment.complete_data", description: "Complete pending payment data" },
    { module: "payments", action: "receipt.download", description: "Download receipt" },
    // Expenses & Suppliers (M05 - F06)
    { module: "expenses", action: "category.list", description: "List expense categories" },
    { module: "expenses", action: "category.create", description: "Create expense category" },
    { module: "expenses", action: "category.update", description: "Update expense category" },
    { module: "expenses", action: "category.delete", description: "Delete expense category" },
    { module: "expenses", action: "expense.list", description: "List expenses" },
    { module: "expenses", action: "expense.create", description: "Create expense" },
    { module: "expenses", action: "expense.update", description: "Update expense" },
    { module: "expenses", action: "expense.cancel", description: "Cancel expense" },
    { module: "expenses", action: "budget.list", description: "List budgets" },
    { module: "expenses", action: "budget.create", description: "Create budget" },
    { module: "expenses", action: "budget.update", description: "Update budget" },
    { module: "expenses", action: "supplier.list", description: "List suppliers" },
    { module: "expenses", action: "supplier.create", description: "Create supplier" },
    { module: "expenses", action: "supplier.update", description: "Update supplier" },
    { module: "expenses", action: "invoice.list", description: "List supplier invoices" },
    { module: "expenses", action: "invoice.create", description: "Create supplier invoice" },
    { module: "expenses", action: "invoice.pay", description: "Pay supplier invoice" },
    // Staff & Payroll (M04 - F07)
    { module: "staff", action: "staff.list", description: "List staff members" },
    { module: "staff", action: "staff.create", description: "Create staff member" },
    { module: "staff", action: "staff.update", description: "Update staff member" },
    { module: "staff", action: "staff.deactivate", description: "Deactivate staff member" },
    { module: "staff", action: "contract.list", description: "List staff contracts" },
    { module: "staff", action: "contract.generate", description: "Generate staff contract PDF" },
    { module: "staff", action: "template.list", description: "List contract templates" },
    { module: "staff", action: "template.create", description: "Create contract template" },
    { module: "staff", action: "attendance.list", description: "List staff attendance" },
    { module: "staff", action: "attendance.create", description: "Record daily attendance" },
    { module: "staff", action: "attendance.update", description: "Update attendance record" },
    { module: "staff", action: "advance.list", description: "List staff advances" },
    { module: "staff", action: "advance.create", description: "Create staff advance" },
    { module: "staff", action: "advance.approve", description: "Approve staff advance" },
    { module: "payroll", action: "period.list", description: "List payroll periods" },
    { module: "payroll", action: "period.create", description: "Create payroll period" },
    { module: "payroll", action: "period.close", description: "Close payroll period" },
    { module: "payroll", action: "period.pay", description: "Pay payroll period" },
    { module: "payroll", action: "item.list", description: "List payroll items" },
    { module: "payroll", action: "receipt.download", description: "Download payroll receipt" },
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
  const accountantRole = allRoles.find((r) => r.code === "accountant");
  const staffRole = allRoles.find((r) => r.code === "staff");

  for (const perm of allPermissions) {
    // SuperAdmin gets all permissions
    if (superAdminRole) {
      await db
        .insert(schema.rolePermissions)
        .values({ roleId: superAdminRole.id, permissionId: perm.id })
        .onConflictDoNothing();
    }
    // TenantAdmin gets all condominium, properties, residents, billing, payments, expenses, staff, payroll, and identity perms
    if (tenantAdminRole) {
      if (
        perm.module === "condominiums" ||
        perm.module === "properties" ||
        perm.module === "residents" ||
        perm.module === "billing" ||
        perm.module === "payments" ||
        perm.module === "expenses" ||
        perm.module === "staff" ||
        perm.module === "payroll" ||
        (perm.module === "identity" && !perm.action.startsWith("tenant."))
      ) {
        await db
          .insert(schema.rolePermissions)
          .values({ roleId: tenantAdminRole.id, permissionId: perm.id })
          .onConflictDoNothing();
      }
    }
    // CondoAdmin gets condominium, properties, residents, billing, payments, expenses, staff, payroll, and user list/create
    if (condoAdminRole) {
      if (
        perm.module === "condominiums" ||
        perm.module === "properties" ||
        perm.module === "residents" ||
        perm.module === "billing" ||
        perm.module === "payments" ||
        perm.module === "expenses" ||
        perm.module === "staff" ||
        perm.module === "payroll" ||
        (perm.module === "identity" && ["user.list", "user.create", "role.list"].includes(perm.action))
      ) {
        await db
          .insert(schema.rolePermissions)
          .values({ roleId: condoAdminRole.id, permissionId: perm.id })
          .onConflictDoNothing();
      }
    }
    // Resident gets link.create, properties.list, statement.read, and payment perms
    if (residentRole) {
      if (
        (perm.module === "residents" && ["link.create", "properties.list"].includes(perm.action)) ||
        (perm.module === "condominiums" && perm.action === "read") ||
        (perm.module === "billing" && perm.action === "statement.read") ||
        (perm.module === "payments" && ["payment.create", "receipt.download", "method.list", "payment.read"].includes(perm.action))
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
        (perm.module === "billing" && ["fee.list", "statement.read", "morosity.read"].includes(perm.action)) ||
        (perm.module === "properties" && ["person.list", "ownership.list"].includes(perm.action)) ||
        (perm.module === "condominiums" && perm.action === "read") ||
        (perm.module === "payments" && ["payment.list", "payment.read", "receipt.download"].includes(perm.action)) ||
        (perm.module === "expenses" && ["expense.list", "budget.list", "supplier.list", "invoice.list"].includes(perm.action)) ||
        (perm.module === "staff" && ["staff.list", "contract.list", "attendance.list"].includes(perm.action)) ||
        (perm.module === "payroll" && ["period.list", "item.list"].includes(perm.action))
      ) {
        await db
          .insert(schema.rolePermissions)
          .values({ roleId: boardMemberRole.id, permissionId: perm.id })
          .onConflictDoNothing();
      }
    }
    // Accountant gets payroll read & close
    if (accountantRole) {
      if (perm.module === "payroll" || perm.module === "expenses" || perm.module === "billing") {
        await db
          .insert(schema.rolePermissions)
          .values({ roleId: accountantRole.id, permissionId: perm.id })
          .onConflictDoNothing();
      }
    }
    // Staff role gets own payroll receipt
    if (staffRole) {
      if (perm.module === "payroll" && perm.action === "receipt.download") {
        await db
          .insert(schema.rolePermissions)
          .values({ roleId: staffRole.id, permissionId: perm.id })
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
  } else {
    superUserId = existingUser[0].id;
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

  // 10. Demo Payment Methods (Fase 5)
  const existingPaymentMethods = await db
    .select()
    .from(schema.paymentMethods)
    .where(eq(schema.paymentMethods.condominiumId, demoCondoId));

  if (existingPaymentMethods.length === 0) {
    await db.insert(schema.paymentMethods).values([
      {
        tenantId: demoTenantId,
        condominiumId: demoCondoId,
        name: "Pago Móvil Banesco",
        type: "mobile_payment",
        details: {
          bankName: "Banesco Banco Universal (0134)",
          phone: "0414-1234567",
          holderName: "Condominio Residencias El Ávila",
          holderId: "J-30987654-1",
          notes: "Por favor incluir número de referencia completo de 6 a 8 dígitos.",
        },
        requiresReference: true,
        requiresPhone: true,
        isActive: true,
      },
      {
        tenantId: demoTenantId,
        condominiumId: demoCondoId,
        name: "Transferencia Banesco",
        type: "transfer",
        details: {
          bankName: "Banesco Banco Universal",
          accountNumber: "0134-0012-34-1234567890",
          holderName: "Condominio Residencias El Ávila",
          holderId: "J-30987654-1",
          notes: "Transferencias mismo banco se concilian en 24h hábiles.",
        },
        requiresReference: true,
        requiresPhone: false,
        isActive: true,
      },
      {
        tenantId: demoTenantId,
        condominiumId: demoCondoId,
        name: "Zelle USD",
        type: "other",
        details: {
          email: "pagos@elavila.condo.com",
          holderName: "El Ávila Condominium Management LLC",
          notes: "Indicar en la nota de Zelle exclusivamente el código de su unidad (ej: PH-01).",
        },
        requiresReference: true,
        requiresPhone: false,
        isActive: true,
      },
      {
        tenantId: demoTenantId,
        condominiumId: demoCondoId,
        name: "Efectivo USD (Oficina de Administración)",
        type: "cash",
        details: {
          notes: "Horario de recepción: Lunes a Viernes 8:00 AM - 1:00 PM. Se entrega recibo físico sellado.",
        },
        requiresReference: false,
        requiresPhone: false,
        isActive: true,
      },
    ]);
  }

  // 10. Expenses & Suppliers (Fase 6)
  const existingCategories = await db
    .select()
    .from(schema.expenseCategories)
    .where(eq(schema.expenseCategories.condominiumId, demoCondoId));

  if (existingCategories.length === 0) {
    console.log("🌱 Seeding expense categories, suppliers, budgets and expenses...");

    // 10.1 Default System Expense Categories
    const [catElevators, catSecurity, catCleaning, catGardening, catUtilities, catCommissions, catMaintenance] = await db
      .insert(schema.expenseCategories)
      .values([
        {
          tenantId: demoTenantId,
          condominiumId: demoCondoId,
          name: "Mantenimiento de Ascensores",
          description: "Servicio técnico preventivo y correctivo de ascensores",
          color: "blue",
          isSystem: true,
        },
        {
          tenantId: demoTenantId,
          condominiumId: demoCondoId,
          name: "Seguridad y Vigilancia",
          description: "Servicio de vigilancia privada 24/7 garita y áreas",
          color: "indigo",
          isSystem: true,
        },
        {
          tenantId: demoTenantId,
          condominiumId: demoCondoId,
          name: "Limpieza y Aseo",
          description: "Insumos, recolección y servicio de conserjería/aseo",
          color: "emerald",
          isSystem: true,
        },
        {
          tenantId: demoTenantId,
          condominiumId: demoCondoId,
          name: "Jardinería y Áreas Verdes",
          description: "Poda, abono y cuidado de jardines ornamentales",
          color: "teal",
          isSystem: true,
        },
        {
          tenantId: demoTenantId,
          condominiumId: demoCondoId,
          name: "Servicios Públicos",
          description: "Electricidad común, bombeo de agua y gas",
          color: "amber",
          isSystem: true,
        },
        {
          tenantId: demoTenantId,
          condominiumId: demoCondoId,
          name: "Comisiones Bancarias y Financieras",
          description: "Comisiones por transferencias, mantenimiento de cuenta e impuestos IGTF",
          color: "purple",
          isSystem: true,
        },
        {
          tenantId: demoTenantId,
          condominiumId: demoCondoId,
          name: "Mantenimiento General y Bombas",
          description: "Sistema hidroneumático, iluminación y portones eléctricos",
          color: "rose",
          isSystem: true,
        },
      ])
      .returning();

    // 10.2 Suppliers
    const [suppSchindler, suppSecurity, suppHydraulic, suppCleaning] = await db
      .insert(schema.suppliers)
      .values([
        {
          tenantId: demoTenantId,
          condominiumId: demoCondoId,
          name: "Ascensores Schindler Vzla C.A.",
          taxId: "J-12345678-9",
          contact: "Ing. Carlos Pérez",
          email: "servicio@schindler-demo.com",
          phone: "+58 212 900-1122",
          address: "Av. Francisco de Miranda, Torre Cavendes, Chacao",
          creditDays: 30,
          category: "Ascensores",
          notes: "Contrato mensual con visita técnica los primeros 5 días hábiles.",
        },
        {
          tenantId: demoTenantId,
          condominiumId: demoCondoId,
          name: "Seguridad Integral El Ávila S.R.L.",
          taxId: "J-23456789-0",
          contact: "Lic. Roberto Gómez",
          email: "contacto@seguridad-avila.com",
          phone: "+58 212 762-3344",
          address: "Centro Plaza, Torre B, Piso 8, Los Palos Grandes",
          creditDays: 15,
          category: "Seguridad",
          notes: "Dos guardias 24x48 con control de acceso y rondas nocturnas.",
        },
        {
          tenantId: demoTenantId,
          condominiumId: demoCondoId,
          name: "Servicios Hidráulicos y Bombas C.A.",
          taxId: "J-34567890-1",
          contact: "Tec. Luis Rodríguez",
          email: "bombas@hidraulicos-avila.com",
          phone: "+58 414 123-4567",
          address: "Zona Industrial Boleíta Norte, Calle Los Laboratorios",
          creditDays: 15,
          category: "Mantenimiento",
          notes: "Atención de emergencias hidroneumáticas y tablero eléctrico.",
        },
        {
          tenantId: demoTenantId,
          condominiumId: demoCondoId,
          name: "Distribuidora Limpieza Total C.A.",
          taxId: "J-45678901-2",
          contact: "Sra. Elena Blanco",
          email: "ventas@limpiezatotal.com",
          phone: "+58 412 987-6543",
          address: "Calle Madrid con Veracruz, Las Mercedes",
          creditDays: 0,
          category: "Insumos",
          notes: "Proveedor de bolsas, cloro, desinfectante y ceras.",
        },
      ])
      .returning();

    // 10.3 Monthly Budgets for Current Period (2026-10)
    const currentPeriod = "2026-10";
    await db.insert(schema.budgets).values([
      {
        tenantId: demoTenantId,
        condominiumId: demoCondoId,
        categoryId: catElevators.id,
        period: currentPeriod,
        amount: "900.00",
        currency: "USD",
        alertThresholdPct: "80.00",
        notes: "Presupuesto mantenimiento rutinario ascensores",
      },
      {
        tenantId: demoTenantId,
        condominiumId: demoCondoId,
        categoryId: catSecurity.id,
        period: currentPeriod,
        amount: "1400.00",
        currency: "USD",
        alertThresholdPct: "80.00",
        notes: "Servicio de vigilancia privada",
      },
      {
        tenantId: demoTenantId,
        condominiumId: demoCondoId,
        categoryId: catCleaning.id,
        period: currentPeriod,
        amount: "400.00",
        currency: "USD",
        alertThresholdPct: "80.00",
        notes: "Insumos de limpieza y conserjería",
      },
      {
        tenantId: demoTenantId,
        condominiumId: demoCondoId,
        categoryId: catGardening.id,
        period: currentPeriod,
        amount: "300.00",
        currency: "USD",
        alertThresholdPct: "80.00",
        notes: "Mantenimiento mensual jardines",
      },
      {
        tenantId: demoTenantId,
        condominiumId: demoCondoId,
        categoryId: catUtilities.id,
        period: currentPeriod,
        amount: "500.00",
        currency: "USD",
        alertThresholdPct: "80.00",
        notes: "Servicios públicos comunes (luz + bombeo)",
      },
      {
        tenantId: demoTenantId,
        condominiumId: demoCondoId,
        categoryId: catMaintenance.id,
        period: currentPeriod,
        amount: "600.00",
        currency: "USD",
        alertThresholdPct: "80.00",
        notes: "Reparaciones menores y bombas",
      },
    ]);

    // 10.4 Direct Expenses
    await db.insert(schema.expenses).values([
      {
        tenantId: demoTenantId,
        condominiumId: demoCondoId,
        categoryId: catElevators.id,
        supplierId: suppSchindler.id,
        concept: "Mantenimiento preventivo mensual 2 cabinas",
        description: "Revisión electromecánica mensual de ascensores Torre A y Torre B",
        amount: "850.00",
        currency: "USD",
        expenseDate: "2026-10-05",
        status: "paid",
        paymentMethod: "transfer",
        referenceNumber: "TRANS-SCH-8831",
        receiptUrl: "https://minio.residmanager.local/receipts/exp_schindler_oct.pdf",
        createdBy: superUserId,
      },
      {
        tenantId: demoTenantId,
        condominiumId: demoCondoId,
        categoryId: catSecurity.id,
        supplierId: suppSecurity.id,
        concept: "Servicio vigilancia garita - 1era Quincena Octubre",
        description: "Pago de honorarios primera quincena de seguridad",
        amount: "600.00",
        currency: "USD",
        expenseDate: "2026-10-10",
        status: "paid",
        paymentMethod: "transfer",
        referenceNumber: "TRANS-SEG-5510",
        receiptUrl: "https://minio.residmanager.local/receipts/exp_seguridad_q1.pdf",
        createdBy: superUserId,
      },
      {
        tenantId: demoTenantId,
        condominiumId: demoCondoId,
        categoryId: catCleaning.id,
        supplierId: suppCleaning.id,
        concept: "Insumos de limpieza y desinfección áreas comunes",
        description: "Compra mensual de cloro, desinfectante, mopas y bolsas negras jumbo",
        amount: "240.00",
        currency: "USD",
        expenseDate: "2026-10-08",
        status: "paid",
        paymentMethod: "mobile_payment",
        referenceNumber: "PAGOMOVIL-9021",
        receiptUrl: "https://minio.residmanager.local/receipts/fact_limpieza_oct.jpg",
        createdBy: superUserId,
      },
      {
        tenantId: demoTenantId,
        condominiumId: demoCondoId,
        categoryId: catCommissions.id,
        concept: "Comisiones bancarias por transferencias salientes y mantenimiento",
        description: "Débitos automáticos bancarios Banesco cuenta corriente condominio",
        amount: "18.50",
        currency: "USD",
        expenseDate: "2026-10-12",
        status: "paid",
        isBankCommission: true,
        paymentMethod: "transfer",
        referenceNumber: "DEB-BAN-0091",
        createdBy: superUserId,
      },
    ]);

    // 10.5 Supplier Invoices (Cuentas por Pagar)
    const [invSchindler, invSecurity, invHydraulic] = await db
      .insert(schema.supplierInvoices)
      .values([
        {
          tenantId: demoTenantId,
          condominiumId: demoCondoId,
          supplierId: suppSchindler.id,
          categoryId: catElevators.id,
          invoiceNumber: "FAC-SCH-2026-901",
          amount: "850.00",
          paidAmount: "850.00",
          currency: "USD",
          issueDate: "2026-10-01",
          dueDate: "2026-10-31",
          status: "paid",
          notes: "Factura de mantenimiento cubierta oportunamente",
          receiptUrl: "https://minio.residmanager.local/invoices/fac_schindler_901.pdf",
        },
        {
          tenantId: demoTenantId,
          condominiumId: demoCondoId,
          supplierId: suppSecurity.id,
          categoryId: catSecurity.id,
          invoiceNumber: "FAC-SEG-7811",
          amount: "1200.00",
          paidAmount: "600.00",
          currency: "USD",
          issueDate: "2026-10-01",
          dueDate: "2026-10-25",
          status: "partially_paid",
          notes: "Q1 cancelada, pendiente Q2 antes del 25 de Octubre",
          receiptUrl: "https://minio.residmanager.local/invoices/fac_seg_7811.pdf",
        },
        {
          tenantId: demoTenantId,
          condominiumId: demoCondoId,
          supplierId: suppHydraulic.id,
          categoryId: catMaintenance.id,
          invoiceNumber: "FAC-BOMB-552",
          amount: "480.00",
          paidAmount: "0.00",
          currency: "USD",
          issueDate: "2026-09-20",
          dueDate: "2026-10-05", // Vencida
          status: "overdue",
          notes: "Reparación de válvula de retención y flotante del tanque bajo. Vencida.",
          receiptUrl: "https://minio.residmanager.local/invoices/fac_bomb_552.pdf",
        },
      ])
      .returning();

    // 10.6 Supplier Payments
    await db.insert(schema.supplierPayments).values([
      {
        tenantId: demoTenantId,
        condominiumId: demoCondoId,
        supplierInvoiceId: invSchindler.id,
        amount: "850.00",
        currency: "USD",
        paymentDate: "2026-10-05",
        method: "transfer",
        reference: "TRANS-SCH-8831",
        receiptUrl: "https://minio.residmanager.local/receipts/exp_schindler_oct.pdf",
        notes: "Cancelación total de la factura FAC-SCH-2026-901",
        createdBy: superUserId,
      },
      {
        tenantId: demoTenantId,
        condominiumId: demoCondoId,
        supplierInvoiceId: invSecurity.id,
        amount: "600.00",
        currency: "USD",
        paymentDate: "2026-10-10",
        method: "transfer",
        reference: "TRANS-SEG-5510",
        receiptUrl: "https://minio.residmanager.local/receipts/exp_seguridad_q1.pdf",
        notes: "Abono 50% correspondiente a Q1",
        createdBy: superUserId,
      },
    ]);
  }

  // ==========================================
  // 11. Personal, Contratos, Nómina y Asistencia (F07)
  // ==========================================
  const existingStaff = await db
    .select()
    .from(schema.staff)
    .where(eq(schema.staff.condominiumId, demoCondoId));

  if (existingStaff.length === 0) {
    console.log("🌱 Seeding staff, contracts, attendance and payroll...");

    // 11.1 Contract Templates
    const [tplIndividual, tplCompany, tplCoop] = await db
      .insert(schema.contractTemplates)
      .values([
        {
          tenantId: demoTenantId,
          name: "Contrato de Trabajo Individual - Conserjería y Residencia",
          contractType: "individual",
          body: `CONTRATO INDIVIDUAL DE TRABAJO
Entre el Condominio {{condo_name}} y el trabajador {{worker_name}}, portador del documento {{identification}}, se conviene la prestación de servicios en el cargo de {{position}}.
La remuneración mensual será de {{salary}} {{currency}}, canceladera con frecuencia {{frequency}}. El trabajador desempeñará sus funciones en las instalaciones del condominio conforme a las normas de convivencia y asistencia vigentes.
Fecha de ingreso: {{hire_date}}.`,
        },
        {
          tenantId: demoTenantId,
          name: "Contrato Marco de Servicios de Seguridad Privada (Empresa)",
          contractType: "company",
          body: `CONTRATO DE SERVICIOS CORPORATIVOS DE SEGURIDAD
El Condominio {{condo_name}} contrata a la empresa {{worker_name}}, inscrita con RIF {{identification}}, para el servicio de resguardo y control de accesos ({{position}}).
Honorarios convenidos: {{salary}} {{currency}} con periodicidad {{frequency}}.
Fecha de inicio: {{hire_date}}.`,
        },
        {
          tenantId: demoTenantId,
          name: "Contrato Operativo de Mantenimiento y Jardinería (Cooperativa)",
          contractType: "cooperative",
          body: `ACUERDO DE SERVICIOS COOPERATIVOS
Entre la Junta del Condominio {{condo_name}} y la Cooperativa {{worker_name}}, registro fiscal {{identification}}, para labores de {{position}}.
Compromiso de pago: {{salary}} {{currency}}, frecuencia {{frequency}}.
Vigente desde: {{hire_date}}.`,
        },
      ])
      .returning();

    // 11.2 Persons for Staff
    const [personJose, personVig, personCoop] = await db
      .insert(schema.persons)
      .values([
        {
          tenantId: demoTenantId,
          documentType: "V",
          documentNumber: "14285910",
          fullName: "José Vicente Rodríguez Morales",
          email: "jose.rodriguez@sgc.local",
          phone: "+58 412 8829103",
        },
        {
          tenantId: demoTenantId,
          documentType: "J",
          documentNumber: "30918274-1",
          fullName: "Vigilancia Integral Siglo XXI C.A.",
          email: "operaciones@vigilancia21.local",
          phone: "+58 212 9081234",
        },
        {
          tenantId: demoTenantId,
          documentType: "J",
          documentNumber: "41289102-3",
          fullName: "Cooperativa Áreas Verdes & Ornato R.L.",
          email: "contacto@ecoverde.local",
          phone: "+58 414 7712390",
        },
      ])
      .returning();

    // 11.3 Staff records
    const [staffJose, staffSeg, staffJardin] = await db
      .insert(schema.staff)
      .values([
        {
          tenantId: demoTenantId,
          condominiumId: demoCondoId,
          personId: personJose.id,
          position: "Conserje / Mantenimiento Integral",
          contractType: "individual",
          hireDate: "2024-03-01",
          salary: "450.00",
          salaryCurrency: "USD",
          payFrequency: "biweekly",
          bankName: "Banco Mercantil",
          bankAccount: "0105-0023-45-0100482918",
          documentUrl: "https://minio.residmanager.local/staff/ci_jose_rodriguez.pdf",
          status: "active",
          notes: "Habita en la vivienda de conserjería. Excelente puntualidad y trato vecinal.",
          createdBy: superUserId,
        },
        {
          tenantId: demoTenantId,
          condominiumId: demoCondoId,
          personId: personVig.id,
          position: "Seguridad y Control de Acceso Garita 24/7",
          contractType: "company",
          hireDate: "2025-01-15",
          salary: "1200.00",
          salaryCurrency: "USD",
          payFrequency: "monthly",
          bankName: "Banesco Banco Universal",
          bankAccount: "0134-0982-12-0982347102",
          documentUrl: "https://minio.residmanager.local/staff/rif_vigilancia_21.pdf",
          status: "active",
          notes: "Empresa con 3 oficiales rotativos por turno de 12 horas.",
          createdBy: superUserId,
        },
        {
          tenantId: demoTenantId,
          condominiumId: demoCondoId,
          personId: personCoop.id,
          position: "Jardinería, Desmalezado y Piscinas",
          contractType: "cooperative",
          hireDate: "2024-08-01",
          salary: "380.00",
          salaryCurrency: "USD",
          payFrequency: "biweekly",
          bankName: "Bancaribe",
          bankAccount: "0114-0012-33-0019284729",
          documentUrl: "https://minio.residmanager.local/staff/acta_coop_verde.pdf",
          status: "active",
          notes: "Mantenimiento 2 veces por semana: martes y viernes.",
          createdBy: superUserId,
        },
      ])
      .returning();

    // 11.4 Staff Contracts Generated
    await db.insert(schema.staffContracts).values([
      {
        tenantId: demoTenantId,
        staffId: staffJose.id,
        templateId: tplIndividual.id,
        generatedPdfUrl: "https://minio.residmanager.local/contracts/contrato_jose_rodriguez.pdf",
        signedAt: new Date("2024-03-01T10:00:00Z"),
        validFrom: "2024-03-01",
        status: "active",
      },
      {
        tenantId: demoTenantId,
        staffId: staffSeg.id,
        templateId: tplCompany.id,
        generatedPdfUrl: "https://minio.residmanager.local/contracts/contrato_vigilancia_siglo21.pdf",
        signedAt: new Date("2025-01-15T14:30:00Z"),
        validFrom: "2025-01-15",
        status: "active",
      },
    ]);

    // 11.5 Staff Attendance
    await db.insert(schema.staffAttendance).values([
      {
        tenantId: demoTenantId,
        staffId: staffJose.id,
        date: "2026-10-13",
        checkIn: new Date("2026-10-13T07:00:00Z"),
        checkOut: new Date("2026-10-13T16:00:00Z"),
        status: "present",
        notes: "Jornada completada sin novedad. Limpieza de pasillos y sótano.",
      },
      {
        tenantId: demoTenantId,
        staffId: staffJose.id,
        date: "2026-10-14",
        checkIn: new Date("2026-10-14T07:15:00Z"),
        checkOut: new Date("2026-10-14T16:00:00Z"),
        status: "late",
        notes: "Retraso de 15 minutos por traslado de insumos de aseo.",
      },
      {
        tenantId: demoTenantId,
        staffId: staffJose.id,
        date: "2026-10-15",
        checkIn: new Date("2026-10-15T07:00:00Z"),
        status: "present",
        notes: "Presente en labores activas.",
      },
      {
        tenantId: demoTenantId,
        staffId: staffJardin.id,
        date: "2026-10-13",
        checkIn: new Date("2026-10-13T08:00:00Z"),
        checkOut: new Date("2026-10-13T14:00:00Z"),
        status: "present",
        notes: "Poda de arbustos de entrada principal.",
      },
    ]);

    // 11.6 Staff Advances
    const [advJose] = await db
      .insert(schema.staffAdvances)
      .values([
        {
          tenantId: demoTenantId,
          staffId: staffJose.id,
          amount: "100.00",
          currency: "USD",
          reason: "Adelanto para compra de útiles escolares y medicinas",
          approvedBy: superUserId,
          installments: 2,
          remaining: "50.00",
          status: "approved",
        },
      ])
      .returning();

    // 11.7 Payroll Periods & Items
    const [periodOctQ1] = await db
      .insert(schema.payrollPeriods)
      .values([
        {
          tenantId: demoTenantId,
          condominiumId: demoCondoId,
          startDate: "2026-10-01",
          endDate: "2026-10-15",
          status: "closed",
          totalAmount: "1825.00",
        },
        {
          tenantId: demoTenantId,
          condominiumId: demoCondoId,
          startDate: "2026-10-16",
          endDate: "2026-10-31",
          status: "draft",
          totalAmount: "0.00",
        },
      ])
      .returning();

    await db.insert(schema.payrollItems).values([
      {
        tenantId: demoTenantId,
        payrollPeriodId: periodOctQ1.id,
        staffId: staffJose.id,
        baseSalary: "225.00", // Quincena de 450
        deductions: "0.00",
        advancesDiscount: "50.00", // Cuota 1 de adelanto
        netAmount: "175.00",
        currency: "USD",
        receiptPdfUrl: "https://minio.residmanager.local/payroll/recibo_jose_oct_q1.pdf",
        status: "paid",
      },
      {
        tenantId: demoTenantId,
        payrollPeriodId: periodOctQ1.id,
        staffId: staffSeg.id,
        baseSalary: "1200.00", // Mensualidad completa
        deductions: "0.00",
        advancesDiscount: "0.00",
        netAmount: "1200.00",
        currency: "USD",
        receiptPdfUrl: "https://minio.residmanager.local/payroll/recibo_vigilancia_oct.pdf",
        status: "paid",
      },
      {
        tenantId: demoTenantId,
        payrollPeriodId: periodOctQ1.id,
        staffId: staffJardin.id,
        baseSalary: "190.00", // Quincena de 380
        deductions: "0.00",
        advancesDiscount: "0.00",
        netAmount: "190.00",
        currency: "USD",
        receiptPdfUrl: "https://minio.residmanager.local/payroll/recibo_jardin_oct_q1.pdf",
        status: "paid",
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
