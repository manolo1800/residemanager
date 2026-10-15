---
id: M04-STAFF-PAYROLL
title: Módulo Staff & Payroll
version: 1.0
status: active
depends_on: [M01-IDENTITY, M02-CONDOMINIUMS]
used_by_agent_when: "trabajadores, contratos, asistencia, nómina, recibos de pago, adelantos"
last_updated: 2026-10-12
---

# M04 — Staff & Payroll

## 1. Propósito

Gestiona el personal de cada condominio: contratación (3 tipos), generación de contratos, control de asistencia, cálculo de nómina, recibos y adelantos.

## 2. Entidades que posee

| Entidad | Descripción | Tabla |
|---|---|---|
| Staff | Trabajador del condominio | `staff` |
| ContractTemplate | Plantilla de contrato | `contract_templates` |
| StaffContract | Contrato generado | `staff_contracts` |
| StaffAttendance | Registro diario de asistencia | `staff_attendance` |
| PayrollPeriod | Período de nómina | `payroll_periods` |
| PayrollItem | Ítem de nómina por trabajador | `payroll_items` |
| StaffAdvance | Adelanto de sueldo | `staff_advances` |

## 3. Requerimientos funcionales

| ID | Descripción | Prioridad | Fase |
|---|---|---|---|
| RF-M04-001 | Registrar trabajador con tipo de contrato | Must | F7 |
| RF-M04-002 | Generar contrato PDF desde plantilla | Must | F7 |
| RF-M04-003 | Registrar asistencia diaria | Must | F7 |
| RF-M04-004 | Registrar tardanzas y ausencias justificadas | Must | F7 |
| RF-M04-005 | Crear período de nómina | Must | F7 |
| RF-M04-006 | Calcular nómina con deducciones y adelantos | Must | F7 |
| RF-M04-007 | Generar recibo de nómina PDF | Must | F7 |
| RF-M04-008 | Registrar adelanto con cuotas | Must | F7 |
| RF-M04-009 | Aprobar adelanto | Must | F7 |
| RF-M04-010 | Aplicar descuento de adelanto en nómina | Must | F7 |
| RF-M04-011 | Adjuntar documentos al trabajador | Should | F7 |
| RF-M04-012 | Cerrar y pagar período de nómina | Must | F7 |
| RF-M04-013 | Reporte de asistencia por período | Should | F7 |

## 4. Endpoints

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/api/v1/staff` | `staff:staff.list` | Listar trabajadores |
| POST | `/api/v1/staff` | `staff:staff.create` | Crear trabajador |
| PATCH | `/api/v1/staff/:id` | `staff:staff.update` | Editar |
| DELETE | `/api/v1/staff/:id` | `staff:staff.deactivate` | Soft delete |
| GET | `/api/v1/staff/:id/contracts` | `staff:contract.list` | Contratos del trabajador |
| POST | `/api/v1/staff/:id/contracts/generate` | `staff:contract.generate` | Generar contrato PDF |
| GET | `/api/v1/contract-templates` | `staff:template.list` | Plantillas |
| POST | `/api/v1/contract-templates` | `staff:template.create` | Crear plantilla |
| GET | `/api/v1/staff/:id/attendance` | `staff:attendance.list` | Asistencia |
| POST | `/api/v1/staff/:id/attendance` | `staff:attendance.create` | Registrar |
| PATCH | `/api/v1/attendance/:id` | `staff:attendance.update` | Editar |
| GET | `/api/v1/payroll-periods` | `payroll:period.list` | Períodos |
| POST | `/api/v1/payroll-periods` | `payroll:period.create` | Crear período |
| POST | `/api/v1/payroll-periods/:id/close` | `payroll:period.close` | Cerrar |
| POST | `/api/v1/payroll-periods/:id/pay` | `payroll:period.pay` | Marcar pagado |
| GET | `/api/v1/payroll-periods/:id/items` | `payroll:item.list` | Ítems |
| GET | `/api/v1/payroll-items/:id/receipt` | `payroll:receipt.download` | Recibo PDF |
| GET | `/api/v1/staff-advances` | `staff:advance.list` | Adelantos |
| POST | `/api/v1/staff-advances` | `staff:advance.create` | Crear adelanto |
| PATCH | `/api/v1/staff-advances/:id/approve` | `staff:advance.approve` | Aprobar |

## 5. Reglas de negocio aplicables

- BR-023 (tipos de contrato)
- BR-024 (generación de contrato)
- BR-025 (asistencia)
- BR-026 (nómina)
- BR-027 (adelantos)

## 6. Eventos

### Emitidos
| Evento | Cuándo | Payload |
|---|---|---|
| `staff.created.v1` | Nuevo trabajador | `{ staffId, condominiumId, contractType }` |
| `staff.contract.generated.v1` | Contrato PDF | `{ contractId, staffId, url }` |
| `payroll.period.closed.v1` | Cierre | `{ periodId, condominiumId, total }` |
| `payroll.item.paid.v1` | Pago | `{ itemId, staffId, receiptUrl }` |
| `staff.advance.approved.v1` | Adelanto aprobado | `{ advanceId, staffId, amount }` |

### Consumidos
| Evento | Origen | Acción |
|---|---|---|
| `files.uploaded.v1` | M13 | Actualiza URL de adjuntos |

## 7. Dependencias

| Módulo | Cómo | Uso |
|---|---|---|
| M01 | Facade | Identidad y permisos |
| M02 | Facade | Condominio activo |
| M13 | Facade | Envío de recibos por WhatsApp |

## 8. Permisos

| Rol | Acciones |
|---|---|
| `tenant_admin` | `staff:*`, `payroll:*` |
| `condo_admin` | `staff:*`, `payroll:*` |
| `board_member` | `staff:staff.list`, `payroll:item.list` |
| `accountant` | `payroll:*` (lectura y cierre) |
| `staff` | `payroll:receipt.download` (propio) |

## 9. Estados y transiciones

### Staff
active → inactive
active → terminated


### PayrollPeriod
draft → closed → paid


### StaffAdvance
pending → approved → applied
pending → rejected


## 10. Casos borde

- Contrato con tipo `company` incluye RIF; con `individual` cédula.
- Adelanto mayor al 50% del sueldo mensual → requiere aprobación explícita.
- Asistencia duplicada por día → rechazo.
- Nómina con período sin asistencia completa → advertencia pero permite cierre.
- Recibo de nómina de trabajador inactivo → disponible para consulta histórica.
- Contrato sin plantilla → error 400.

## 11. Fuera de alcance del módulo

- Cálculo de prestaciones sociales (v2).
- Vacaciones y permisos formales (v2).
- Firma digital de contratos (v2).
- Cálculo de IVA o retenciones fiscales (v2).

## 12. Criterios de aceptación

- [x] Se crea un trabajador con tipo de contrato.
- [x] Se genera contrato PDF por plantilla.
- [x] Se registra asistencia diaria sin duplicados.
- [x] Se crea período de nómina y calcula neto.
- [x] Se genera recibo PDF.
- [x] Adelanto se descuenta en nómina según cuotas.
- [x] Cierre de período bloquea edición.