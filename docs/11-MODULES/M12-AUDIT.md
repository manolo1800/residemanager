---
id: M12-AUDIT
title: Módulo Audit
version: 1.0
status: active
depends_on: [M01-IDENTITY]
used_by_agent_when: "auditoría transversal, consulta de logs, trazabilidad de cambios"
last_updated: 2026-10-12
---

# M12 — Audit

## 1. Propósito

Registra toda mutación relevante del sistema. Provee trazabilidad total de quién hizo qué, cuándo y sobre qué entidad. Es transversal a todos los módulos.

## 2. Entidades que posee

| Entidad | Descripción | Tabla |
|---|---|---|
| AuditLog | Log de auditoría | `audit_logs` |

## 3. Requerimientos funcionales

| ID | Descripción | Prioridad | Fase |
|---|---|---|---|
| RF-M12-001 | Registrar mutaciones de negocio | Must | F1 |
| RF-M12-002 | Registrar antes/después de cambios | Must | F1 |
| RF-M12-003 | Registrar login/logout | Must | F1 |
| RF-M12-004 | Registrar intentos 403 | Must | F1 |
| RF-M12-005 | Consulta de logs por admin | Must | F11 |
| RF-M12-006 | Filtros por módulo, entidad, usuario, fecha | Should | F11 |
| RF-M12-007 | Retención mínima 5 años | Must | F11 |
| RF-M12-008 | Nunca eliminar logs (ni soft) | Must | F11 |
| RF-M12-009 | Enmascarar PII en logs | Must | F11 |

## 4. Endpoints

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/api/v1/audit-logs` | `audit:log.list` | Listar logs |
| GET | `/api/v1/audit-logs/:id` | `audit:log.read` | Detalle |
| GET | `/api/v1/audit-logs/entity/:entity/:id` | `audit:log.read` | Historial por entidad |

## 5. Reglas de negocio aplicables

- BR-052 (auditoría)

## 6. Eventos

### Emitidos
Ninguno. Es consumidor.

### Consumidos
Escucha **todas** las mutaciones vía interceptor global. No consume eventos de dominio.

## 7. Dependencias

| Módulo | Cómo | Uso |
|---|---|---|
| M01 | Facade | Contexto de usuario |

## 8. Permisos

| Rol | Acciones |
|---|---|
| `tenant_admin` | `audit:log.list`, `audit:log.read` |
| `condo_admin` | `audit:log.list`, `audit:log.read` (de su condominio) |
| `accountant` | `audit:log.list` (filtrado a financiero) |
| `board_member` | — |
| `resident` | — |

## 9. Estados y transiciones

No aplica. Los logs son inmutables.

## 10. Casos borde

- Logs con payloads grandes → truncar y referenciar por ID.
- PII en payloads → enmascarar (documentos, cuentas bancarias, teléfonos).
- Logs de tenants eliminados → se mantienen.
- Volumen alto → particionado por mes.

## 11. Fuera de alcance del módulo

- Alertas en tiempo real por acciones sospechosas (v2).
- SIEM externo (v2).

## 12. Criterios de aceptación

- [ ] Toda mutación de negocio genera log.
- [ ] Login/logout generan log.
- [ ] Intentos 403 generan log.
- [ ] Logs no se pueden editar ni eliminar.
- [ ] Consulta filtra por tenant (nunca cruza).
- [ ] PII enmascarada.