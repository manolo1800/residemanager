---
id: 05-SECURITY-MULTITENANCY
title: Seguridad, multi-tenancy y control de acceso
version: 1.0
audience: human+agent
last_updated: 2026-10-12
---

# 05 — Seguridad y Multi-tenancy

> Este documento es **crítico**. Su incumplimiento rompe el aislamiento de tenants y es motivo de rechazo automático de PR.

---

## 🎯 Objetivos de seguridad

1. **Aislamiento total** entre tenants (cero fuga de datos).
2. **Aislamiento** entre condominios dentro del mismo tenant.
3. **Autorización granular** por rol, módulo y acción.
4. **Trazabilidad completa** de toda mutación.
5. **Cifrado** en tránsito y en reposo.
6. **Cumplimiento** con buenas prácticas OWASP Top 10.

---

## 🏛️ Modelo de multi-tenancy

**Modalidad:** Shared Pool Tenant (SPT).

- Una sola base de datos.
- Todas las tablas de dominio llevan `tenant_id uuid NOT NULL`.
- Las tablas dependientes de un condominio llevan además `condominium_id uuid NOT NULL`.
- Doble capa de aislamiento:
  1. **Aplicación:** repositorios filtran por contexto del request.
  2. **Base de datos:** Row Level Security (RLS).

---

## 🔐 Capa 1 — Aislamiento por aplicación

### Contexto por request

Todo request pasa por un middleware que construye el `RequestContext`:

```ts
interface RequestContext {
  userId: string;
  tenantId: string;
  activeCondominiumId: string | null;
  roles: string[];
  permissions: Set<string>;
  requestId: string;
  ip: string;
  userAgent: string;
}
Este contexto se inyecta vía AsyncLocalStorage y es accesible desde cualquier capa.

Reglas duras
Ningún repositorio puede ejecutar una query sin tenant_id.

Ningún servicio puede usar un tenantId distinto al del contexto.

Ningún endpoint acepta tenant_id desde el cliente (siempre desde el JWT).

Ningún listado devuelve datos sin paginación.

Repositorios seguros por defecto
ts
// packages/database/repository.base.ts
abstract class BaseRepository<T> {
  protected abstract table: PgTable;

  protected baseQuery(ctx: RequestContext) {
    let q = db.select().from(this.table);
    q = q.where(eq(this.table.tenantId, ctx.tenantId));
    if ('condominiumId' in this.table && ctx.activeCondominiumId) {
      q = q.where(eq(this.table.condominiumId, ctx.activeCondominiumId));
    }
    q = q.where(isNull(this.table.deletedAt));
    return q;
  }
}
Cualquier método que se salga del patrón debe justificarse.

🛡️ Capa 2 — Row Level Security (RLS)
Habilitar RLS por tabla
Toda tabla de dominio debe:

sql
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;
ALTER TABLE <table> FORCE ROW LEVEL SECURITY;
FORCE asegura que ni el owner de la tabla evite RLS.

Política de tenant
sql
CREATE POLICY tenant_isolation ON <table>
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);
Política de condominio (para tablas dependientes)
sql
CREATE POLICY condominium_isolation ON <table>
  USING (
    condominium_id IS NULL
    OR condominium_id = current_setting('app.condominium_id', true)::uuid
  );
Establecer contexto por transacción
Al inicio de cada transacción:

sql
SET LOCAL app.tenant_id = '<uuid>';
SET LOCAL app.condominium_id = '<uuid>';
Esto se hace automáticamente desde un wrapper de Drizzle:

ts
async function withContext<T>(
  ctx: RequestContext,
  fn: (tx) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SET LOCAL app.tenant_id = ${ctx.tenantId}`);
    if (ctx.activeCondominiumId) {
      await tx.execute(sql`SET LOCAL app.condominium_id = ${ctx.activeCondominiumId}`);
    }
    return fn(tx);
  });
}
Usuario de base de datos
La API usa un usuario no-owner con permisos limitados.

El owner solo se usa en migraciones.

El usuario de la API no puede desactivar RLS.

Tests obligatorios de RLS
Test de fuga: usuario de tenant A no puede leer datos de tenant B.

Test de fuga por condominio: usuario de condominio X no ve datos de Y.

Test de bypass: ninguna query del código de negocio puede saltar RLS.

Ejecutar SET ROLE api_user en tests para validar políticas.

🔑 Autenticación
Flujo
text
1. Usuario envía credenciales a POST /auth/login.
2. API valida con Argon2id.
3. API emite:
   - access token (JWT, 15 min)
   - refresh token (opaco, 7 días, guardado hasheado en sessions)
4. Cliente usa access token en Authorization: Bearer.
5. Al expirar, POST /auth/refresh con refresh token.
6. Al hacer logout, se revoca el refresh en sessions.
Contenido del JWT
json
{
  "sub": "user_uuid",
  "tenant_id": "tenant_uuid",
  "active_condominium_id": "condo_uuid | null",
  "roles": ["condo_admin"],
  "iat": 1700000000,
  "exp": 1700000900,
  "iss": "sgc",
  "aud": "sgc-web"
}
Reglas
Algoritmo: HS256 en v1. (RS256 cuando haya múltiples servicios).

access no lleva datos sensibles.

refresh nunca viaja en el JWT; es opaco y se valida contra DB.

Password mínimo: 12 caracteres, con complejidad.

Bloqueo temporal tras 5 intentos fallidos (rate limit).

Sin 2FA en v1 (ver 17-FUTURE-SCOPE.md).

Switch de condominio
No cambia el JWT.

Header X-Condominium-Id en cada request.

El backend valida que el usuario tenga user_condominium_access activo.

Si el usuario no tiene acceso → 403 CONDOMINIUM_ACCESS_DENIED.

El frontend refresca datos al cambiar el header.

👥 Autorización (RBAC)
Modelo
roles: conjunto de permisos, globales o por tenant.

permissions: module:action.

user_tenant_roles: asignación de rol a usuario en un tenant.

user_condominium_access: asignación de rol a usuario en un condominio.

Roles base
Rol	Alcance	Descripción
super_admin	Global	Administra el SaaS, tenants y configuración global
tenant_admin	Tenant	Dueño de la administradora. Crea condominios y admins.
condo_admin	Condominio	Opera el condominio. Único que crea admins de su condominio.
board_member	Condominio	Junta de condominio. Ve reportes y aprueba extraordinarias.
resident	Condominio	Ve estado de cuenta, sube comprobantes.
accountant	Condominio	Acceso a reportes, conciliación, gastos.
staff	Condominio	Personal del condominio. Solo su información.
Permisos por módulo × acción
Formato: <module>:<action>.

Ejemplos:

text
identity:user.create
identity:user.invite
condominiums:condo.create
condominiums:condo.update
properties:unit.create
residents:link.approve
staff:staff.create
payroll:payroll.close
billing:fee.create
payments:payment.approve
payments:payment.register_admin
payments:payment.complete_data
bank:import.create
bank:reconciliation.approve
minutes:minute.create
minutes:minute.notify
reports:report.export
Listado completo en packages/contracts/permissions.ts.

Guards
Todo endpoint debe tener:

ts
@RequirePermission('payments:payment.approve')
El guard verifica:

Usuario autenticado.

Tenant coincide con el JWT.

Condominio activo coincide con el header.

Permiso presente en el set del contexto.

Reglas especiales
Solo condo_admin principal puede crear otros condo_admin.

resident no puede aprobar pagos — solo subir.

board_member no puede crear gastos, solo verlos.

staff no ve datos financieros salvo sus propios recibos.

🧾 Auditoría
Qué se audita
Toda mutación de datos de negocio:

Creación, modificación, soft delete.

Cambios de estado (aprobación, rechazo, cancelación).

Login/logout.

Cambio de tenant o condominio activo.

Intento de acceso denegado (403).

Errores 500 relevantes.

Formato del log
ts
interface AuditLog {
  id: string;
  tenantId: string;
  condominiumId: string | null;
  userId: string;
  module: string;              // 'payments'
  entity: string;              // 'Payment'
  entityId: string;
  action: string;              // 'approve'
  before: object | null;
  after: object | null;
  ip: string;
  userAgent: string;
  createdAt: Date;
}
Cómo se registra
Un interceptor global de NestJS captura los cambios y delega en AuditService.

Reglas:

Nunca loguea datos sensibles (passwords, tokens).

Nunca loguea PII sin enmascarar (documentos, cuentas bancarias).

Siempre incluye requestId para correlación.

Retención
Retención mínima: 5 años.

Nunca se elimina un log.

Particionado por mes si el volumen lo justifica.

🗑️ Soft delete
Reglas
Nunca DELETE FROM.

Toda tabla con borrado lógico tiene deleted_at timestamptz.

Toda query por defecto filtra deleted_at IS NULL.

Los registros con soft delete se excluyen de listados, búsquedas y agregaciones.

Los históricos solo se exponen a roles autorizados.

Excepciones
audit_logs: nunca se borra, ni siquiera soft.

payment_receipts: si un pago se rechaza, el comprobante permanece.

bank_movements: nunca se borran, son históricos del banco.

Cascada
El soft delete no propaga automáticamente.

Si una unidad se desactiva, sus cargos permanecen.

Si un residente se desactiva, sus pagos permanecen.

🔒 Seguridad en tránsito y reposo
En tránsito
HTTPS obligatorio en producción (TLS 1.2+).

HSTS habilitado.

Certificados gestionados por Let's Encrypt.

CORS estricto: solo el dominio del frontend.

En reposo
PostgreSQL: cifrado de disco a nivel de infraestructura.

MinIO: cifrado SSE-S3 o SSE-KMS.

Backups cifrados.

Secretos gestionados por variables de entorno + Vault en producción.

Headers de seguridad
Helmet con configuración estricta.

CSP restrictiva.

X-Frame-Options: DENY.

X-Content-Type-Options: nosniff.

Referrer-Policy: strict-origin-when-cross-origin.

🧱 Rate limiting y protección
Área	Límite
Login	5 intentos/min por IP
Refresh	20/min por usuario
API general	300/min por usuario
Uploads	30/min por usuario
Reportes	10/min por usuario
Conciliación	5/hora por condominio
Implementación: @fastify/rate-limit con backing store en Redis.

🔑 Gestión de secretos
Nunca en código.

Nunca en logs.

Variables de entorno + gestor de secretos (Vault, Doppler, AWS Secrets Manager).

Rotación cada 90 días.

Contraseñas de DB distintas por entorno.

🧪 Tests de seguridad obligatorios
Aislamiento cross-tenant (no fuga).

Aislamiento cross-condo dentro del mismo tenant.

Permisos por endpoint (cada rol probado).

Rate limiting efectivo.

JWT expirado → 401.

JWT manipulado → 401.

Acceso a endpoint sin permiso → 403.

RLS activo en todas las tablas (test automático que recorre el schema).

Auditoría registrada tras cada mutación.

Soft delete respetado en todas las queries.

🚨 Checklist antes de cada PR (seguridad)
□ ¿Toda query filtra por tenant_id?
□ ¿Filtra por condominium_id si aplica?
□ ¿El endpoint tiene @RequirePermission?
□ ¿El guard verifica tenant + condominio?
□ ¿La tabla nueva tiene RLS habilitado?
□ ¿La tabla nueva tiene tenant_id + índices?
□ ¿La mutación pasa por AuditService?
□ ¿No hay PII en logs?
□ ¿No hay secretos hardcodeados?
□ ¿Respeta soft delete?
□ ¿Hay test que verifica aislamiento?

📌 Regla de oro
Un dato que cruza tenants es un bug crítico, no un bug normal.
Si dudas, detente y pregunta. Si un test de aislamiento falla, no se mergea.