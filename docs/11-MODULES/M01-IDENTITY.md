---
id: M01-IDENTITY
title: Módulo Identity
version: 1.0
status: active
depends_on: []
used_by_agent_when: "autenticación, usuarios, roles, permisos, sesiones, switch de condominio"
last_updated: 2026-10-12
---

# M01 — Identity

## 1. Propósito

Gestiona identidad, autenticación, autorización, sesiones, tenants, roles y permisos. Es la base sobre la que todos los demás módulos operan.

## 2. Entidades que posee

| Entidad | Descripción | Tabla |
|---|---|---|
| Tenant | Administradora cliente del SaaS | `tenants` |
| User | Cuenta de usuario | `users` |
| Role | Conjunto de permisos | `roles` |
| Permission | Acción autorizable | `permissions` |
| RolePermission | Relación rol↔permiso | `role_permissions` |
| UserTenantRole | Rol de usuario en un tenant | `user_tenant_roles` |
| UserCondominiumAccess | Rol de usuario en un condominio | `user_condominium_access` |
| Session | Sesión activa con refresh token | `sessions` |

## 3. Requerimientos funcionales

| ID | Descripción | Prioridad | Fase |
|---|---|---|---|
| RF-M01-001 | Login con email + password (Argon2id) | Must | F1 |
| RF-M01-002 | Emisión de access JWT (15 min) y refresh opaco (7 días) | Must | F1 |
| RF-M01-003 | Refresh de access token con rotación de refresh | Must | F1 |
| RF-M01-004 | Logout con revocación de refresh | Must | F1 |
| RF-M01-005 | Middleware de contexto (tenant + condominio activo) | Must | F1 |
| RF-M01-006 | Switch de condominio vía header `X-Condominium-Id` | Must | F1 |
| RF-M01-007 | RBAC granular por módulo:acción | Must | F1 |
| RF-M01-008 | Creación de tenants (SuperAdmin) | Must | F1 |
| RF-M01-009 | Creación de condominios por tenant_admin | Must | F1 |
| RF-M01-010 | Solo condo_admin principal crea otros condo_admin | Must | F1 |
| RF-M01-011 | Rate limiting en login y refresh | Should | F1 |
| RF-M01-012 | Bloqueo temporal tras 5 intentos fallidos | Should | F1 |
| RF-M01-013 | Listado de sesiones activas por usuario | Could | F1 |
| RF-M01-014 | Revocación remota de sesión | Could | F1 |

## 4. Endpoints

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/api/v1/auth/check-email` | público | Verifica si un correo ya existe en el sistema |
| POST | `/api/v1/auth/register-condominium` | público | Alta de administrador principal y creación de su condominio |
| POST | `/api/v1/auth/login` | público | Login |
| POST | `/api/v1/auth/refresh` | público | Refresh de token |
| POST | `/api/v1/auth/logout` | `identity:session.revoke` | Logout |
| GET | `/api/v1/auth/me` | autenticado | Perfil actual |
| PATCH | `/api/v1/auth/me` | autenticado | Actualizar perfil propio |
| POST | `/api/v1/auth/switch-condominium` | autenticado | Cambia condominio activo |
| GET | `/api/v1/tenants` | `identity:tenant.list` | Listar tenants (SuperAdmin) |
| POST | `/api/v1/tenants` | `identity:tenant.create` | Crear tenant |
| PATCH | `/api/v1/tenants/:id` | `identity:tenant.update` | Editar tenant |
| GET | `/api/v1/users` | `identity:user.list` | Listar usuarios |
| POST | `/api/v1/users/invite` | `identity:user.invite` | Invitar usuario |
| PATCH | `/api/v1/users/:id` | `identity:user.update` | Editar usuario |
| POST | `/api/v1/users/:id/deactivate` | `identity:user.deactivate` | Desactivar (soft) |
| GET | `/api/v1/roles` | `identity:role.list` | Listar roles |
| GET | `/api/v1/permissions` | `identity:permission.list` | Catálogo de permisos |

## 5. Reglas de negocio aplicables

- BR-051 (soft delete)
- BR-052 (auditoría)
- BR-053 (aislamiento)

## 6. Eventos

### Emitidos
| Evento | Cuándo | Payload |
|---|---|---|
| `identity.user.created.v1` | Nuevo usuario | `{ userId, tenantId, email }` |
| `identity.user.deactivated.v1` | Desactivación | `{ userId, tenantId }` |
| `identity.session.revoked.v1` | Logout forzado | `{ userId, sessionId }` |

### Consumidos
Ninguno.

## 7. Dependencias

Ninguna. Es la raíz.

## 8. Permisos

| Rol | Acciones |
|---|---|
| `super_admin` | Todas las de `identity:*` |
| `tenant_admin` | `identity:user.*`, `identity:role.list` |
| `condo_admin` | `identity:user.create` (solo condo_admin), `identity:role.list` |
| `board_member` | `identity:user.list` |
| `resident` | — |
| `accountant` | `identity:user.list` |
| `staff` | — |

## 9. Estados y transiciones

### User
active → inactive
inactive → active


### Session
active → revoked
active → expired


## 10. Casos borde

- Login con email que existe en múltiples tenants → el usuario debe elegir tenant si no está en el JWT.
- Switch a un condominio sin acceso → 403 `CONDOMINIUM_ACCESS_DENIED`.
- Refresh token expirado o revocado → 401.
- Cambio de password invalida refresh tokens activos.
- Desactivar usuario → revoca sesiones y bloquea login.

## 11. Fuera de alcance del módulo

- 2FA (v2).
- SSO / OAuth social (v2).
- Recuperación de password por SMS (solo email).
- Gestión de suscripciones del SaaS (v2).

## 12. Criterios de aceptación

- [x] Login válido devuelve access + refresh.
- [x] Access token expira en 15 min.
- [x] Refresh rota el token.
- [x] Switch de condominio valida acceso.
- [x] Usuario sin permiso recibe 403.
- [ ] Rate limiting bloquea tras 5 intentos.
- [ ] Auditoría registra login/logout.
- [x] Soft delete respetado en usuarios.