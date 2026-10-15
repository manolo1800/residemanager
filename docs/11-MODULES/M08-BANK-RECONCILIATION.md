---
id: M08-BANK-RECONCILIATION
title: Módulo Bank Reconciliation
version: 1.0
status: active
depends_on: [M01-IDENTITY, M02-CONDOMINIUMS, M05-EXPENSES-SUPPLIERS, M07-PAYMENTS]
used_by_agent_when: "conciliación bancaria, importación TXT, parsers por banco, matching, inconsistencias, comisiones"
last_updated: 2026-10-12
---

# M08 — Bank Reconciliation

## 1. Propósito

Importa archivos TXT de bancos, parsea movimientos, sugiere matches con pagos registrados y genera reportes de inconsistencias. Soporta múltiples cuentas por condominio.

## 2. Entidades que posee

| Entidad | Descripción | Tabla |
|---|---|---|
| BankAccount | Cuenta bancaria del condominio | `bank_accounts` |
| BankImport | Importación de archivo | `bank_imports` |
| BankMovement | Movimiento bancario | `bank_movements` |
| ReconciliationMatch | Match movimiento↔pago/gasto | `reconciliation_matches` |
| ReconciliationIssue | Inconsistencia detectada | `reconciliation_issues` |
| BankParser | Parser por banco | `bank_parsers` |

## 3. Requerimientos funcionales

| ID | Descripción | Prioridad | Fase |
|---|---|---|---|
| RF-M08-001 | Múltiples cuentas por condominio | Must | F8 |
| RF-M08-002 | Importar TXT con parser por banco | Must | F8 |
| RF-M08-003 | Parser Banesco (base inicial) | Must | F8 |
| RF-M08-004 | Framework de parsers plug-in | Must | F8 |
| RF-M08-005 | Motor de matching con scoring | Must | F8 |
| RF-M08-006 | Reporte de inconsistencias | Must | F8 |
| RF-M08-007 | Aprobación manual de matches | Must | F8 |
| RF-M08-008 | Bandeja de movimientos huérfanos | Must | F8 |
| RF-M08-009 | Comisiones bancarias → gasto operativo | Must | F8 |
| RF-M08-010 | Clasificación automática por descripción | Should | F8 |
| RF-M08-011 | Detección de duplicados | Must | F8 |
| RF-M08-012 | Filtros por fecha, tipo, estado | Should | F8 |

## 4. Endpoints

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/api/v1/bank-accounts` | `bank:account.list` | Cuentas |
| POST | `/api/v1/bank-accounts` | `bank:account.create` | Crear cuenta |
| PATCH | `/api/v1/bank-accounts/:id` | `bank:account.update` | Editar |
| GET | `/api/v1/bank-parsers` | `bank:parser.list` | Parsers disponibles |
| POST | `/api/v1/bank-imports` | `bank:import.create` | Subir TXT |
| GET | `/api/v1/bank-imports/:id` | `bank:import.read` | Detalle de importación |
| GET | `/api/v1/bank-movements` | `bank:movement.list` | Movimientos |
| GET | `/api/v1/reconciliation-matches` | `bank:match.list` | Sugerencias |
| PATCH | `/api/v1/reconciliation-matches/:id/approve` | `bank:match.approve` | Aprobar match |
| PATCH | `/api/v1/reconciliation-matches/:id/reject` | `bank:match.reject` | Rechazar match |
| GET | `/api/v1/reconciliation-issues` | `bank:issue.list` | Inconsistencias |
| PATCH | `/api/v1/reconciliation-issues/:id/resolve` | `bank:issue.resolve` | Marcar resuelta |

## 5. Reglas de negocio aplicables

- BR-017 (parser por banco)
- BR-018 (normalización)
- BR-019 (matching)
- BR-020 (inconsistencias)
- BR-021 (aprobación manual)
- BR-022 (comisiones)

## 6. Eventos

### Emitidos
| Evento | Cuándo | Payload |
|---|---|---|
| `bank.import.completed.v1` | Parseo OK | `{ importId, movements }` |
| `bank.movement.classified.v1` | Clasificado | `{ movementId, category }` |
| `bank.movement.matched.v1` | Match sugerido | `{ movementId, paymentId, score }` |
| `bank.reconciliation.completed.v1` | Aprobación | `{ importId, matchedCount }` |
| `bank.issue.detected.v1` | Inconsistencia | `{ issueId, type }` |

### Consumidos
| Evento | Origen | Acción |
|---|---|---|
| `payments.payment.approved.v1` | M07 | Habilita matching |

## 7. Dependencias

| Módulo | Cómo | Uso |
|---|---|---|
| M01 | Facade | Permisos |
| M02 | Facade | Condominio |
| M05 | Evento | Registro de comisiones |
| M07 | Facade + Evento | Pagos registrados |

## 8. Permisos

| Rol | Acciones |
|---|---|
| `tenant_admin` | `bank:*` |
| `condo_admin` | `bank:*` |
| `accountant` | `bank:*` (excepto crear cuentas) |
| `board_member` | `bank:movement.list`, `bank:issue.list` |

## 9. Estados y transiciones

### BankImport

processing → completed
processing → failed


### ReconciliationMatch

suggested → approved
suggested → rejected


## 10. Casos borde

- TXT con encoding distinto (latin1) → parser debe decodificar.
- Descripción con caracteres especiales → normalizar.
- Movimiento con misma referencia y monto que otro → duplicado.
- Comisión sin pago asociado → gasto operativo automático.
- Import duplicado del mismo mes → advertencia.
- Monto con coma decimal y miles con punto → parser correcto.
- Referencias de longitud variable → parser no asume formato fijo.

## 11. Fuera de alcance del módulo

- Integración directa con API del banco (v2).
- Open Banking (v2).
- OCR de estados de cuenta en PDF (v2).

## 12. Criterios de aceptación

- [ ] Se importa un TXT de Banesco correctamente.
- [ ] Los movimientos se clasifican automáticamente.
- [ ] El motor sugiere matches con score.
- [ ] Admin aprueba o rechaza sugerencias.
- [ ] Se generan issues de inconsistencias.
- [ ] Comisiones se registran como gasto.
- [ ] Duplicados son detectados.