---
id: M06-BILLING
title: Módulo Billing (Cobranza)
version: 1.0
status: active
depends_on: [M01-IDENTITY, M02-CONDOMINIUMS, M03-PROPERTIES-RESIDENTS]
used_by_agent_when: "cuotas ordinarias, extraordinarias, impuestos, mora, multimoneda, generación de cargos, estado de cuenta"
last_updated: 2026-10-12
---

# M06 — Billing (Cobranza)

## 1. Propósito

Motor de cobranza: define planes de cuota, genera cargos mensuales por unidad, aplica impuestos y mora, maneja multimoneda y provee el estado de cuenta.

## 2. Entidades que posee

| Entidad | Descripción | Tabla |
|---|---|---|
| FeePlan | Plan de cuota (ordinaria/extraordinaria) | `fee_plans` |
| UnitCharge | Cargo por unidad/período | `unit_charges` |
| MoraRule | Regla de mora | `mora_rules` |
| CurrencyRate | Tipo de cambio | `currency_rates` |

## 3. Requerimientos funcionales

| ID | Descripción | Prioridad | Fase |
|---|---|---|---|
| RF-M06-001 | Crear cuota ordinaria (fija o variable) | Must | F4 |
| RF-M06-002 | Crear cuota extraordinaria con acta opcional | Must | F4 |
| RF-M06-003 | Aplicar impuestos según configuración | Must | F4 |
| RF-M06-004 | Convertir a moneda extranjera al aceptar pago | Must | F4 |
| RF-M06-005 | Calcular mora fija o porcentual | Must | F4 |
| RF-M06-006 | Generar cargos mensuales por unidad | Must | F4 |
| RF-M06-007 | Recalcular cargos al cambiar configuración | Should | F4 |
| RF-M06-008 | Estado de cuenta por unidad | Must | F4 |
| RF-M06-009 | Panel de morosidad | Must | F4 |
| RF-M06-010 | Recalcular mora periódicamente | Must | F4 |
| RF-M06-011 | Soporte de pagos parciales (opcional) | Should | F4 |
| RF-M06-012 | Listar cargos por período y unidad | Must | F4 |

## 4. Endpoints

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/api/v1/fee-plans` | `billing:fee.list` | Listar planes |
| POST | `/api/v1/fee-plans` | `billing:fee.create` | Crear plan |
| PATCH | `/api/v1/fee-plans/:id` | `billing:fee.update` | Editar |
| DELETE | `/api/v1/fee-plans/:id` | `billing:fee.cancel` | Cancelar (soft) |
| GET | `/api/v1/unit-charges` | `billing:charge.list` | Listar cargos |
| POST | `/api/v1/unit-charges/generate` | `billing:charge.generate` | Generar cargos del mes |
| GET | `/api/v1/units/:id/statement` | `billing:statement.read` | Estado de cuenta |
| GET | `/api/v1/billing/morosity` | `billing:morosity.read` | Panel de morosidad |
| GET | `/api/v1/mora-rules` | `billing:mora.list` | Reglas de mora |
| POST | `/api/v1/mora-rules` | `billing:mora.create` | Crear regla |
| GET | `/api/v1/currency-rates` | `billing:rate.list` | Tipos de cambio |
| POST | `/api/v1/currency-rates` | `billing:rate.create` | Registrar tasa |

## 5. Reglas de negocio aplicables

- BR-001, BR-002, BR-003 (cuotas)
- BR-004 (impuestos)
- BR-005 (multimoneda)
- BR-006 (mora)
- BR-007 (parciales)
- BR-008 (selección de meses)
- BR-009 (impago → mora)
- BR-046 (estado de cuenta)

## 6. Eventos

### Emitidos
| Evento | Cuándo | Payload |
|---|---|---|
| `billing.charges.generated.v1` | Mes | `{ condominiumId, period, count }` |
| `billing.charge.overdue.v1` | Vencido | `{ chargeId, unitId, amount }` |
| `billing.mora.applied.v1` | Mora | `{ chargeId, moraAmount }` |
| `billing.fee.created.v1` | Cuota | `{ feePlanId, type }` |

### Consumidos
| Evento | Origen | Acción |
|---|---|---|
| `payments.payment.approved.v1` | M07 | Aplica a cargos |
| `payments.payment.approved_pending_data.v1` | M07 | Aplica a cargos (mismo efecto) |
| `condominiums.unit.created.v1` | M02 | Genera cargos pendientes |

## 7. Dependencias

| Módulo | Cómo | Uso |
|---|---|---|
| M01 | Facade | Permisos |
| M02 | Facade | Unidades, configuración |
| M03 | Facade | Propietarios |
| M07 | Evento | Aplicación de pagos |
| M09 | Facade | Validar acta para extraordinaria |

## 8. Permisos

| Rol | Acciones |
|---|---|
| `tenant_admin` | `billing:*` |
| `condo_admin` | `billing:*` |
| `board_member` | `billing:fee.list`, `billing:statement.read`, `billing:morosity.read` |
| `accountant` | `billing:*` (excepto crear cuotas) |
| `resident` | `billing:statement.read` (propio) |

## 9. Estados y transiciones

### UnitCharge
pending → partially_paid → paid
pending → overdue → paid
pending → cancelled


## 10. Casos borde

- Cuota extraordinaria sin acta cuando el condominio lo exige → bloqueado.
- Cambio de moneda base con cargos activos → recalculo + aviso.
- Mora sobre mora → no aplica (solo sobre base).
- Cargo de unidad desactivada → no se genera nuevo, históricos se mantienen.
- Cambio de tarifa de mora retroactivo → solo aplica hacia adelante.
- Pago que supera total adeudado → se rechaza o genera saldo a favor (configurable, v2).

## 11. Fuera de alcance del módulo

- Alícuota por unidad (v2).
- Saldo a favor / crédito (v2).
- Intereses compuestos (v2).

## 12. Criterios de aceptación

- [ ] Se genera el cargo mensual para todas las unidades.
- [ ] El impuesto se aplica según configuración.
- [ ] La mora se calcula al vencer.
- [ ] El estado de cuenta refleja cargos y pagos.
- [ ] El panel de morosidad lista deudores.
- [ ] Cuota extraordinaria exige acta si está configurado.