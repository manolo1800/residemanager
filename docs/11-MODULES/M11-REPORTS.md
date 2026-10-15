---
id: M11-REPORTS
title: Módulo Reports
version: 1.0
status: active
depends_on: [M05, M06, M07, M08]
used_by_agent_when: "reportes, exportaciones Excel/PDF, estado de cuenta, morosidad, ingresos vs egresos, presupuesto"
last_updated: 2026-10-12
---

# M11 — Reports

## 1. Propósito

Genera reportes operativos y financieros exportables a Excel y PDF. Incluye generación asíncrona para reportes grandes.

## 2. Entidades que posee

No posee entidades propias. Consume datos de M05, M06, M07, M08.

## 3. Requerimientos funcionales

| ID | Descripción | Prioridad | Fase |
|---|---|---|---|
| RF-M11-001 | Estado de cuenta por unidad | Must | F10 |
| RF-M11-002 | Morosidad general | Must | F10 |
| RF-M11-003 | Morosidad por edificio/bloque | Must | F10 |
| RF-M11-004 | Ingresos vs egresos | Must | F10 |
| RF-M11-005 | Presupuesto ejecutado vs real | Must | F10 |
| RF-M11-006 | Conciliaciones y discrepancias | Must | F10 |
| RF-M11-007 | Cuentas por pagar a proveedores | Must | F10 |
| RF-M11-008 | Pagos con datos pendientes | Must | F10 |
| RF-M11-009 | Exportación Excel | Must | F10 |
| RF-M11-010 | Exportación PDF | Must | F10 |
| RF-M11-011 | Generación asíncrona para reportes grandes | Should | F10 |
| RF-M11-012 | Descarga vía URL temporal | Must | F10 |

## 4. Endpoints

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/api/v1/reports/unit-statement` | `reports:statement.read` | Estado de cuenta |
| GET | `/api/v1/reports/morosity` | `reports:morosity.read` | Morosidad |
| GET | `/api/v1/reports/income-expenses` | `reports:income_expenses.read` | Ingresos vs egresos |
| GET | `/api/v1/reports/budget` | `reports:budget.read` | Presupuesto |
| GET | `/api/v1/reports/reconciliation` | `reports:reconciliation.read` | Conciliación |
| GET | `/api/v1/reports/supplier-payables` | `reports:payables.read` | Cuentas por pagar |
| GET | `/api/v1/reports/pending-data-payments` | `reports:pending_data.read` | Pagos pendientes de datos |
| POST | `/api/v1/reports/export` | `reports:export.create` | Solicitar exportación |
| GET | `/api/v1/reports/exports/:id` | `reports:export.read` | Estado de exportación |

## 5. Reglas de negocio aplicables

- BR-045 (exportación)
- BR-046 (estado de cuenta)
- BR-047 (morosidad)

## 6. Eventos

### Emitidos
| Evento | Cuándo | Payload |
|---|---|---|
| `reports.export.requested.v1` | Solicitud | `{ exportId, type, format }` |
| `reports.export.ready.v1` | Listo | `{ exportId, url }` |

### Consumidos
Ninguno.

## 7. Dependencias

| Módulo | Cómo | Uso |
|---|---|---|
| M01 | Facade | Permisos |
| M02 | Facade | Configuración |
| M05 | Facade | Gastos |
| M06 | Facade | Cargos y mora |
| M07 | Facade | Pagos |
| M08 | Facade | Conciliación |

## 8. Permisos

| Rol | Acciones |
|---|---|
| `tenant_admin` | `reports:*` |
| `condo_admin` | `reports:*` |
| `board_member` | `reports:statement.read`, `reports:morosity.read`, `reports:income_expenses.read` |
| `accountant` | `reports:*` |
| `resident` | `reports:statement.read` (propio) |

## 9. Estados y transiciones

### ExportJob
pending → processing → ready
→ failed


## 10. Casos borde

- Reporte con >50k filas → asíncrono + notificación.
- Exportación con moneda extranjera → muestra tasa aplicada.
- Reporte en idioma distinto al default → traducido por locale del usuario.
- Reporte en PDF muy grande → split por páginas.

## 11. Fuera de alcance del módulo

- Dashboards interactivos (v2).
- Reportes programados por email (v2).
- BI embebido (v2).

## 12. Criterios de aceptación

- [ ] Todos los reportes exportan a Excel y PDF.
- [ ] Reportes grandes se generan en background.
- [ ] URLs temporales expiran correctamente.
- [ ] Reportes usan locale y timezone correctos.
- [ ] Filtros por rango y condominio funcionan.