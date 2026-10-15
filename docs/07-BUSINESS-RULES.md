
---

## 🗂️ `docs/07-BUSINESS-RULES.md`

```markdown
---
id: 07-BUSINESS-RULES
title: Reglas de negocio parametrizables
version: 1.0
audience: human+agent
last_updated: 2026-10-12
---

# 07 — Reglas de Negocio

> Cada regla tiene un ID (`BR-NNN`) que **nunca se reutiliza**. Toda implementación debe referenciar el ID en el código (comentario o nombre de test).

---

## 📖 Convenciones

- **BR-NNN:** identificador único.
- **Parámetro:** valor configurable por condominio o tenant.
- **Precondición:** qué debe cumplirse antes.
- **Postcondición:** qué debe cumplirse después.
- **Excepciones:** casos donde no aplica.
- **Ejemplos:** al menos uno por regla.

---

## 💵 Cobranza

### BR-001 — Cuota ordinaria
- **Descripción:** el condominio define si la cuota ordinaria es fija o variable.
- **Parámetro:** `condominiums.ordinary_fee_mode ∈ {fixed, variable}`.
- **Fixed:** misma cuota para todas las unidades del mismo alcance.
- **Variable:** cada unidad tiene un monto distinto definido en `fee_plans`.
- **Ejemplo:** edificio con 10 aptos, cuota fija Bs 100 → todos pagan 100.

### BR-002 — Alcance de cuota
- **Descripción:** una cuota puede aplicar a todas las unidades, a un edificio/bloque, o a una unidad específica.
- **Parámetro:** `fee_plans.applies_to ∈ {all, structure, unit}`.
- **Ejemplo:** cuota de mantenimiento de ascensor → solo aplica al edificio que lo tiene.

### BR-003 — Cuota extraordinaria
- **Descripción:** cuota puntual para gasto no presupuestado.
- **Requisito:** si `condominiums.extraordinary_requires_meeting = true`, debe existir un acta o asamblea aprobatoria.
- **Vinculación:** `fee_plans.minute_id` referencia el acta.
- **Precondición:** acta emitida con estado `issued` o `notified`.

### BR-004 — Impuestos
- **Descripción:** el condominio define si está exento y cómo maneja impuestos.
- **Parámetros:**
  - `condominiums.tax_exempt boolean`
  - `condominiums.tax_rate numeric(5,2)`
  - `condominiums.tax_included_in_fee boolean`
- **Exento:** no se agrega impuesto.
- **Incluido:** el monto base ya contiene impuesto.
- **Agregado:** se suma `base * tax_rate` al total.
- **Ejemplo:** cuota 100, IVA 16%, incluido → total 100; agregado → 116.

### BR-005 — Multimoneda
- **Descripción:** soporte para pago en moneda base o extranjera.
- **Parámetros:** `condominiums.base_currency`, `condominiums.foreign_currency`, `foreign_currency_enabled`.
- **Conversión:** se aplica `currency_rates` al momento de aceptar el pago.
- **Registra:** `exchange_rate` y `amount_base_currency` en el pago.
- **Ejemplo:** condominio en Bs con USD habilitado, tasa 40. Pago de 10 USD → 400 Bs.

### BR-006 — Mora
- **Descripción:** recargo por pago atrasado.
- **Parámetros:**
  - `condominiums.mora_type ∈ {fixed, percentage}`
  - `condominiums.mora_value`
  - `mora_rules.applies_after_days`
- **Fixed:** monto fijo por período de atraso.
- **Percentage:** % sobre la cuota vencida.
- **Aplicación:** al generar el cargo del mes siguiente si el anterior sigue impago.

### BR-007 — Pagos parciales
- **Descripción:** permite pago incompleto con plazo.
- **Parámetro:** `condominiums.partial_payments_enabled boolean`.
- **Si activo:**
  - Se registra `is_partial = true`.
  - Se calcula `remaining_amount` y `due_date`.
  - Si `partial_payment_interest_enabled`, se aplica interés.
- **Si inactivo:** se rechaza el pago por monto insuficiente.

### BR-008 — Selección de meses a pagar
- **Descripción:** el pagador selecciona uno o varios meses a cubrir.
- **Aplicación:** el sistema suma los cargos seleccionados y aplica el pago a esos períodos específicos.
- **Regla:** no se aplica FIFO automático en v1 (aplicación dirigida).
- **Ejemplo:** meses enero y febrero, total 200, pago 200 → ambos saldados.

### BR-009 — Impago → mora
- **Descripción:** si un cargo llega a `due_date` sin pago completo, pasa a `overdue` y se aplica mora según BR-006.

### BR-010 — Recibo de pago
- **Descripción:** todo pago aprobado genera recibo PDF descargable.
- **Incluye:** unidad, meses cubiertos, monto, moneda, tasa, fecha, método, referencia.
- **Nota especial:** si estado = `approved_pending_data`, incluye aviso "Pendiente por completar datos de pago".

---

## 💳 Pagos

### BR-011 — Origen del pago
- **Descripción:** todo pago tiene `origin ∈ {resident, admin}`.
- **Resident:** creado por el residente desde su cuenta.
- **Admin:** creado por un administrador a nombre de una unidad.
- **Trazabilidad:** siempre se guarda `registered_by_user_id`.

### BR-012 — Aprobación sin datos completos
- **Descripción:** un pago aprobado sin comprobante ni referencia pasa a `approved_pending_data`.
- **Precondición:** `reference_number IS NULL` Y no hay registros en `payment_receipts`.
- **Postcondición:**
  - `status = 'approved_pending_data'`
  - `pending_data_reason = 'Sin comprobante ni número de transferencia'`
  - El pago **sí impacta** el estado de cuenta.
- **Impacto contable:** idéntico a `approved`.

### BR-013 — Completar datos de pago
- **Descripción:** un pago en `approved_pending_data` pasa a `approved` cuando se completa comprobante o referencia.
- **Postcondición:**
  - `status = 'approved'`
  - `data_completed_at = now()`
  - `data_completed_by = <user>`
  - `pending_data_reason = NULL`

### BR-014 — Rechazo de pago
- **Descripción:** un admin puede rechazar un pago con motivo.
- **Postcondición:** `status = 'rejected'`, se notifica al residente, no impacta cargos.

### BR-015 — Idempotencia
- **Descripción:** endpoints de pago aceptan `Idempotency-Key`.
- **Regla:** misma key + mismo payload → misma respuesta, sin efecto doble.
- **Retención:** la key se guarda 24h en Redis.

### BR-016 — Medios de pago
- **Descripción:** el condominio configura sus medios de pago.
- **Campos obligatorios:** nombre, tipo, datos bancarios.
- **Visibilidad:** el residente solo ve los activos.

---

## 🏦 Conciliación bancaria

### BR-017 — Parser por banco
- **Descripción:** cada banco tiene su parser registrado en `bank_parsers`.
- **Estructura:** delimitador, encoding, mapa de columnas, separadores decimal/miles, manejo de signos.

### BR-018 — Normalización de montos
- **Descripción:** los TXT de Banesco usan coma decimal y punto de miles.
- **Regla:** `+` → crédito, `-` → débito.
- **Ejemplo:** `+39.500,00` → `39500.00` crédito.

### BR-019 — Matching automático
- **Descripción:** el motor sugiere matches entre movimientos y pagos registrados.
- **Criterios:** referencia, monto, fecha (±3 días).
- **Score de confianza:** `matching_rules`:
  - Referencia + monto exactos → 95
  - Monto + fecha ±1 día → 80
  - Monto + fecha ±3 días → 60
- **Umbral:** score ≥ 80 → sugerencia fuerte; < 80 → sugerencia débil.

### BR-020 — Reporte de inconsistencias
- **Descripción:** tras cada importación, se generan reportes de:
  - Movimientos sin match (huérfanos).
  - Pagos sin movimiento bancario.
  - Duplicados.
  - Diferencias de monto > 1%.
- **Estado:** queda en `reconciliation_issues` para revisión del admin.

### BR-021 — Aprobación manual
- **Descripción:** ningún match se aprueba automáticamente.
- **Regla:** el admin aprueba/rechaza cada sugerencia.

### BR-022 — Comisiones bancarias
- **Descripción:** movimientos categoría `commission` se registran como gasto operativo.
- **Postcondición:** se crea `expenses` con `is_bank_commission = true` y `source_bank_movement_id`.

---

## 👷 Personal

### BR-023 — Tipos de contrato
- **Descripción:** `company`, `cooperative`, `individual`.
- **Diferencia:** datos fiscales y plantilla de contrato.
- **Ejemplo:** contrato con empresa incluye RIF; con particular, cédula.

### BR-024 — Generación de contrato
- **Descripción:** se genera PDF desde `contract_templates` (Handlebars).
- **Disponible:** descarga e impresión.
- **No firmado digitalmente en v1.**

### BR-025 — Asistencia
- **Descripción:** registro diario por trabajador.
- **Estados:** presente, ausente, tardanza, justificado.
- **Regla:** un registro por trabajador por día.

### BR-026 — Nómina
- **Descripción:** cálculo por período con base + deducciones + adelantos.
- **Postcondición:** genera `payroll_items` con recibo PDF.

### BR-027 — Adelantos
- **Descripción:** préstamo al trabajador con cuotas descontadas en nómina.
- **Parámetros:** monto, cuotas, motivo.
- **Estado:** pendiente → aprobado → aplicado.

---

## 🏢 Condominios y propiedades

### BR-028 — Tipo de condominio
- **Descripción:** `buildings` (edificios con pisos) o `houses` (casas por bloques o etapas).

### BR-029 — Nomenclatura de unidades
- **Descripción:** cada unidad tiene un `code` único por condominio.
- **Ejemplo:** `A-1203`, `Casa 45`.

### BR-030 — Código identificador
- **Descripción:** cada condominio tiene un `code` único por tenant.
- **Uso:** vinculación de residentes por búsqueda.

### BR-031 — Vinculación de residente
- **Descripción:** residente se registra → busca por nombre → ve coincidencias → elige → ingresa código de unidad → queda `pending`.
- **Aprobación:** el `condo_admin` aprueba o rechaza.

### BR-032 — Traspaso de propiedad
- **Descripción:** propietario actual transfiere a otro.
- **Requisito:** adjuntar contrato.
- **Aprobación:** admin valida.
- **Postcondición:** se crea nuevo `unit_ownerships` activo, el anterior queda `transferred`.

### BR-033 — Multi-propiedad
- **Descripción:** un residente puede tener N propiedades en N condominios del mismo tenant.

---

## 📄 Actas, incidencias, quejas

### BR-034 — Numeración de actas
- **Descripción:** consecutiva por condominio, sin huecos.
- **Implementación:** secuencia o tabla `condominium_counters`.

### BR-035 — Estados de acta
- **Descripción:** `draft`, `issued`, `notified`, `closed`.
- **Transiciones:**
  - draft → issued (admin)
  - issued → notified (envío a involucrado)
  - notified → closed (respuesta o plazo)

### BR-036 — Hash de integridad
- **Descripción:** al emitir el acta se calcula SHA-256 sobre el contenido.
- **Uso:** verificación posterior.

### BR-037 — Quejas anónimas
- **Descripción:** `reporter_user_id` puede ser NULL.
- **Regla:** admin no puede ver la identidad si es anónima.
- **Notificación:** el involucrado recibe aviso sin conocer al autor.

---

## 💸 Gastos y proveedores

### BR-038 — Categorías de gasto
- **Descripción:** configurables por condominio.
- **Base del sistema:** limpieza, jardinería, ascensores, seguridad, servicios.

### BR-039 — Presupuesto mensual
- **Descripción:** por categoría y período.
- **Alerta:** al superar `alert_threshold_pct` (default 80%).

### BR-040 — Cuentas por pagar
- **Descripción:** proveedor con crédito tiene `credit_days`.
- **Estados:** pending, partially_paid, paid, overdue.

---

## ⚙️ Configuración

### BR-041 — Personalización visual
- **Descripción:** el condominio puede configurar colores, logo, favicon.
- **Validación:** contraste AA mínimo.

### BR-042 — Políticas propias
- **Descripción:** además de los términos del sistema, el condominio puede tener los suyos.
- **Activación:** `terms_own_enabled`.

### BR-043 — Zona horaria
- **Descripción:** default por país, configurable por condominio.
- **Interno:** siempre UTC.

### BR-044 — Formato de fecha
- **Descripción:** configurable por condominio.
- **Interno:** siempre 24h.

---

## 📊 Reportes

### BR-045 — Exportación
- **Descripción:** todos los reportes exportan a Excel y PDF.
- **Generación:** asíncrona en cola para reportes grandes (>10k filas).

### BR-046 — Estado de cuenta
- **Descripción:** por unidad, con histórico de cargos y pagos.
- **Incluye:** mora, saldo, meses pagados, meses pendientes.

### BR-047 — Morosidad
- **Descripción:** listado de unidades con saldo vencido.
- **Filtros:** por edificio, bloque, mes, rango de monto.

---

## 🔔 Notificaciones

### BR-048 — Eventos notificables
- Pago registrado por admin → notifica al residente.
- Pago pendiente de datos → recordatorio al admin cada 7 días.
- Datos de pago completados → notifica al residente.
- Cuota emitida → notifica a residentes.
- Acta emitida → notifica al involucrado.
- Incidencia actualizada → notifica al reportero.
- Recordatorio de pago (3 días antes de vencimiento).

### BR-049 — Canales
- Push (Firebase) para usuarios con la app.
- WhatsApp (Baileys) para recordatorios y recibos.
- Email fuera de alcance v1.

### BR-050 — Idiomas de notificación
- Se usa el `locale` del usuario destinatario.

---

## 📌 Reglas generales

### BR-051 — Soft delete
- Nunca borrado físico.
- Filtro `deleted_at IS NULL` por defecto.

### BR-052 — Auditoría
- Toda mutación de negocio se audita.

### BR-053 — Aislamiento
- Toda query filtra por `tenant_id` (y `condominium_id` si aplica).

### BR-054 — Idempotencia
- Endpoints mutantes aceptan `Idempotency-Key`.

### BR-055 — Reversibilidad
- Toda acción crítica debe poder deshacerse (rechazar, cancelar, revertir) sin borrar el histórico.