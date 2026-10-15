---
id: M05-EXPENSES-SUPPLIERS
title: Módulo Expenses & Suppliers
version: 1.0
status: active
depends_on: [M01-IDENTITY, M02-CONDOMINIUMS]
used_by_agent_when: "gastos operativos, categorías, presupuestos, proveedores, cuentas por pagar, comisiones bancarias"
last_updated: 2026-10-12
---

# M05 — Expenses & Suppliers

## 1. Propósito

Gestiona egresos operativos del condominio, categorías, presupuestos, proveedores, cuentas por pagar y registro automático de comisiones bancarias.

## 2. Entidades que posee

| Entidad | Descripción | Tabla |
|---|---|---|
| ExpenseCategory | Categoría de gasto | `expense_categories` |
| Expense | Gasto operativo | `expenses` |
| Budget | Presupuesto mensual por categoría | `budgets` |
| Supplier | Proveedor | `suppliers` |
| SupplierInvoice | Factura a crédito | `supplier_invoices` |
| SupplierPayment | Pago a proveedor | `supplier_payments` |

## 3. Requerimientos funcionales

| ID | Descripción | Prioridad | Fase |
|---|---|---|---|
| RF-M05-001 | CRUD de categorías de gasto | Must | F6 |
| RF-M05-002 | Registrar gasto con comprobante | Must | F6 |
| RF-M05-003 | Definir presupuesto mensual por categoría | Must | F6 |
| RF-M05-004 | Alerta al superar umbral del presupuesto | Should | F6 |
| RF-M05-005 | CRUD de proveedores | Must | F6 |
| RF-M05-006 | Registrar factura a crédito | Must | F6 |
| RF-M05-007 | Registrar pago a proveedor | Must | F6 |
| RF-M05-008 | Comisiones bancarias como gasto operativo | Must | F8 |
| RF-M05-009 | Reporte de gastos por categoría | Should | F10 |
| RF-M05-010 | Reporte de cuentas por pagar | Should | F10 |
| RF-M05-011 | Estado de factura (pendiente/pagada/vencida) | Must | F6 |

## 4. Endpoints

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/api/v1/expense-categories` | `expenses:category.list` | Listar |
| POST | `/api/v1/expense-categories` | `expenses:category.create` | Crear |
| PATCH | `/api/v1/expense-categories/:id` | `expenses:category.update` | Editar |
| GET | `/api/v1/expenses` | `expenses:expense.list` | Listar gastos |
| POST | `/api/v1/expenses` | `expenses:expense.create` | Registrar gasto |
| PATCH | `/api/v1/expenses/:id` | `expenses:expense.update` | Editar |
| DELETE | `/api/v1/expenses/:id` | `expenses:expense.cancel` | Cancelar (soft) |
| GET | `/api/v1/budgets` | `expenses:budget.list` | Presupuestos |
| POST | `/api/v1/budgets` | `expenses:budget.create` | Crear presupuesto |
| PATCH | `/api/v1/budgets/:id` | `expenses:budget.update` | Editar |
| GET | `/api/v1/suppliers` | `expenses:supplier.list` | Proveedores |
| POST | `/api/v1/suppliers` | `expenses:supplier.create` | Crear |
| GET | `/api/v1/supplier-invoices` | `expenses:invoice.list` | Facturas |
| POST | `/api/v1/supplier-invoices` | `expenses:invoice.create` | Crear |
| POST | `/api/v1/supplier-invoices/:id/pay` | `expenses:invoice.pay` | Pagar |

## 5. Reglas de negocio aplicables

- BR-038 (categorías)
- BR-039 (presupuesto)
- BR-040 (cuentas por pagar)
- BR-022 (comisiones bancarias)

## 6. Eventos

### Emitidos
| Evento | Cuándo | Payload |
|---|---|---|
| `expenses.expense.created.v1` | Gasto | `{ expenseId, categoryId, amount }` |
| `expenses.budget.exceeded.v1` | Umbral | `{ budgetId, categoryId, spent, limit }` |
| `expenses.invoice.overdue.v1` | Vencida | `{ invoiceId, supplierId, dueDate }` |
| `expenses.bank_commission.registered.v1` | Comisión | `{ expenseId, sourceMovementId }` |

### Consumidos
| Evento | Origen | Acción |
|---|---|---|
| `bank.movement.classified.v1` | M08 | Registra comisión bancaria |

## 7. Dependencias

| Módulo | Cómo | Uso |
|---|---|---|
| M01 | Facade | Permisos |
| M02 | Facade | Condominio activo |
| M08 | Evento | Comisiones bancarias |

## 8. Permisos

| Rol | Acciones |
|---|---|
| `tenant_admin` | `expenses:*` |
| `condo_admin` | `expenses:*` |
| `accountant` | `expenses:*` (excepto cancelar) |
| `board_member` | `expenses:expense.list`, `expenses:budget.list` |

## 9. Estados y transiciones

### Expense
pending → paid
pending → rejected


### SupplierInvoice
pending → partially_paid → paid
pending → overdue


## 10. Casos borde

- Gasto con moneda extranjera → guarda tasa.
- Cancelación de gasto ya pagado → bloqueado (solo reverso).
- Categoría con gastos asociados → soft delete permitido pero no reutilizable.
- Comisión bancaria duplicada (misma referencia) → idempotencia.
- Factura con vencimiento ya pasado al crear → estado `overdue` automático.

## 11. Fuera de alcance del módulo

- Facturación fiscal / tributaria (v2).
- Aprobación multinivel de gastos (v2).
- Integración con bancos para pagos automáticos (v2).

## 12. Criterios de aceptación
 
- [x] Se registran gastos por categoría.
- [x] Presupuesto genera alerta al superar umbral.
- [x] Facturas de proveedor cambian de estado correctamente.
- [x] Comisiones bancarias se registran automáticamente como gasto operativo.
- [x] Reportes y desglose de flujo de caja (ingresos vs egresos).
