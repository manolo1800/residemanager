---
id: M07-PAYMENTS
title: Módulo Payments
version: 1.1
status: active
depends_on: [M01-IDENTITY, M02-CONDOMINIUMS, M03-PROPERTIES-RESIDENTS, M06-BILLING]
used_by_agent_when: "pagos, comprobantes, recibos, aprobación, pago asistido por admin, approved_pending_data"
last_updated: 2026-10-12
---

# M07 — Payments

## 1. Propósito

Gestiona el ciclo completo de pago offline: residente sube comprobante, admin aprueba, ambos reciben recibo. Incluye registro manual por admin y estado `approved_pending_data`.

## 2. Entidades que posee

| Entidad | Descripción | Tabla |
|---|---|---|
| PaymentMethod | Medio de pago configurable | `payment_methods` |
| Payment | Pago registrado | `payments` |
| PaymentReceipt | Comprobante subido | `payment_receipts` |
| PaymentAllocation | Aplicación a cargos | `payment_allocations` |
| PartialPaymentPlan | Plan de pago parcial | `partial_payment_plans` |

## 3. Requerimientos funcionales

| ID | Descripción | Prioridad | Fase |
|---|---|---|---|
| RF-M07-001 | Configurar medios de pago por condominio | Must | F5 |
| RF-M07-002 | Selección de meses a pagar (uno por uno) | Must | F5 |
| RF-M07-003 | Cálculo automático del total | Must | F5 |
| RF-M07-004 | Subida de comprobante | Must | F5 |
| RF-M07-005 | Registro de datos (ref, fecha, teléfono) | Must | F5 |
| RF-M07-006 | Aprobación/rechazo por admin | Must | F5 |
| RF-M07-007 | Registro manual por admin (pago asistido) | Must | F5 |
| RF-M07-008 | Estado `approved_pending_data` sin datos | Must | F5 |
| RF-M07-009 | Completar datos pendientes | Must | F5 |
| RF-M07-010 | Recibo PDF descargable | Must | F5 |
| RF-M07-011 | Multi-moneda en pago | Must | F5 |
| RF-M07-012 | Idempotencia en endpoints mutantes | Must | F5 |
| RF-M07-013 | Filtro "Pendientes de datos" | Must | F5 |
| RF-M07-014 | Notificación al residente al aprobar/rechazar | Should | F5 |

## 4. Endpoints

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/api/v1/payment-methods` | `payments:method.list` | Medios de pago |
| POST | `/api/v1/payment-methods` | `payments:method.create` | Crear medio |
| PATCH | `/api/v1/payment-methods/:id` | `payments:method.update` | Editar |
| GET | `/api/v1/payments` | `payments:payment.list` | Listar pagos |
| GET | `/api/v1/payments/:id` | `payments:payment.read` | Detalle |
| POST | `/api/v1/payments` | `payments:payment.create` | Residente sube pago |
| POST | `/api/v1/payments/admin` | `payments:payment.register_admin` | Admin registra pago |
| PATCH | `/api/v1/payments/:id/approve` | `payments:payment.approve` | Aprobar |
| PATCH | `/api/v1/payments/:id/reject` | `payments:payment.reject` | Rechazar |
| PATCH | `/api/v1/payments/:id/complete-data` | `payments:payment.complete_data` | Completar datos |
| GET | `/api/v1/payments/pending-data` | `payments:payment.list` | Pendientes de datos |
| GET | `/api/v1/payments/:id/receipt` | `payments:receipt.download` | Recibo PDF |
| GET | `/api/v1/me/payments` | autenticado | Pagos propios |

## 5. Reglas de negocio aplicables

- BR-007 (pagos parciales)
- BR-008 (selección de meses)
- BR-010 (recibo)
- BR-011 (origen)
- BR-012 (aprobación sin datos)
- BR-013 (completar datos)
- BR-014 (rechazo)
- BR-015 (idempotencia)
- BR-016 (medios de pago)

## 6. Eventos

### Emitidos
| Evento | Cuándo | Payload |
|---|---|---|
| `payments.payment.created.v1` | Creación | `{ paymentId, unitId, amount }` |
| `payments.payment.approved.v1` | Aprobación completa | `{ paymentId, unitId, allocations }` |
| `payments.payment.approved_pending_data.v1` | Aprobación sin datos | `{ paymentId, unitId, reason }` |
| `payments.payment.rejected.v1` | Rechazo | `{ paymentId, reason }` |
| `payments.payment.data_completed.v1` | Datos completados | `{ paymentId, completedBy }` |
| `payments.receipt.generated.v1` | Recibo PDF | `{ paymentId, url }` |

### Consumidos
| Evento | Origen | Acción |
|---|---|---|
| `billing.charges.generated.v1` | M06 | Habilita selección de meses |
| `bank.movement.matched.v1` | M08 | Sugiere aprobación |

## 7. Dependencias

| Módulo | Cómo | Uso |
|---|---|---|
| M01 | Facade | Permisos |
| M02 | Facade | Configuración de condominio |
| M03 | Facade | Residente y unidad |
| M06 | Facade + Evento | Cargos y aplicación |
| M13 | Facade | Notificaciones |

## 8. Permisos

| Rol | Acciones |
|---|---|
| `tenant_admin` | `payments:*` |
| `condo_admin` | `payments:*` |
| `board_member` | `payments:payment.list`, `payments:receipt.download` |
| `accountant` | `payments:payment.list`, `payments:payment.approve`, `payments:receipt.download` |
| `resident` | `payments:payment.create` (propio), `payments:receipt.download` (propio), `me:payments.list` |

## 9. Estados y transiciones

### Payment
pending → in_review → approved
→ approved_pending_data → approved
→ rejected
→ cancelled


Regla: `approved_pending_data → approved` al completar datos.

## 10. Casos borde

- Pago sin comprobante ni referencia → `approved_pending_data`.
- Pago con comprobante sin referencia → `approved`.
- Pago rechazado → notifica, no impacta cargos.
- Pago con tasa de cambio → se guarda rate y monto base.
- Múltiples comprobantes por pago → se aceptan; `has_receipt = true` con uno.
- Pago asistido sin residente vinculado → se permite si la unidad tiene propietario.
- Completar datos de un pago ya aprobado completo → 409 `PAYMENT_ALREADY_COMPLETE`.
- Reintento con misma `Idempotency-Key` → misma respuesta sin duplicar.

## 11. Fuera de alcance del módulo

- Pasarela de pago en línea (v2).
- OCR de comprobantes (v2).
- Pago recurrente automático (v2).

## 12. Criterios de aceptación

- [ ] Residente selecciona meses y calcula total.
- [ ] Sube comprobante y datos.
- [ ] Admin aprueba y se aplica a cargos.
- [ ] Admin registra pago sin datos → `approved_pending_data`.
- [ ] Completar datos pasa a `approved`.
- [ ] Recibo PDF descargable en ambos casos.
- [ ] Idempotencia respetada.
- [ ] Filtro "Pendientes de datos" funciona.