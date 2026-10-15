
---

## 🗂️ `docs/15-USER-STORIES.md`

```markdown
---
id: 15-USER-STORIES
title: Backlog de historias de usuario
version: 1.0
audience: human+agent
last_updated: 2026-10-12
---

# 15 — User Stories

> Formato: `US-M0X-NNN`. Criterios de aceptación en Gherkin. Estimación: S (≤1d), M (2–3d), L (4–7d).

---

## 🔐 M01 — Identity

### US-M01-001 — Login
**Como** usuario **quiero** iniciar sesión con email y contraseña **para** acceder al sistema.
**Estimación:** M **Fase:** F1

```gherkin
Scenario: Login exitoso
  Given un usuario activo con credenciales válidas
  When envía POST /auth/login con email y password
  Then recibe 200 con access token y refresh token
  And se registra en audit_logs

Scenario: Credenciales inválidas
  Given un usuario existente
  When envía credenciales incorrectas
  Then recibe 401 con código AUTH_INVALID_CREDENTIALS

Scenario: Bloqueo tras 5 intentos
  Given un usuario que falló 5 veces
  When intenta login de nuevo
  Then recibe 429 con código AUTH_TOO_MANY_ATTEMPTS

US-M01-002 — Switch de condominio
Como admin quiero cambiar entre condominios para operar sin cerrar sesión.
Estimación: M Fase: F1

Scenario: Switch exitoso
  Given un admin con acceso a 2 condominios
  When envía X-Condominium-Id con el segundo
  Then los listados devuelven datos del segundo condominio

Scenario: Sin acceso al condominio
  Given un admin sin acceso a un condominio
  When envía X-Condominium-Id de ese condominio
  Then recibe 403 CONDOMINIUM_ACCESS_DENIED



🏢 M02 — Condominiums
US-M02-001 — Crear condominio de edificios
Como tenant_admin quiero crear un condominio tipo edificios para empezar a administrarlo.
Estimación: M Fase: F2

Scenario: Creación exitosa
  Given un tenant_admin autenticado
  When crea un condominio tipo buildings con 3 edificios de 10 pisos
  Then el condominio se crea con código único
  And se generan las estructuras y unidades

US-M02-002 — Personalizar colores y logo
Como condo_admin quiero configurar colores y logo para que la app refleje la identidad del condominio.
Estimación: S Fase: F1

Scenario: Cambio de color primario
  Given un condo_admin autenticado
  When actualiza primary_color a #22C55E
  Then el frontend refleja el cambio sin recargar


👥 M03 — Properties & Residents
US-M03-001 — Vinculación de residente
Como residente quiero vincularme a mi unidad para ver mi estado de cuenta.
Estimación: M Fase: F3

Scenario: Vinculación exitosa
  Given un residente registrado
  When busca por nombre "Residencias Los Robles"
  Then ve coincidencias con dirección
  And elige una e ingresa el código de unidad
  And queda pendiente hasta aprobación del admin

Scenario: Unidad ya ocupada
  Given una unidad con propietario activo distinto
  When el residente intenta vincularse
  Then recibe 409 UNIT_ALREADY_OCCUPIED


US-M03-002 — Traspaso de propiedad
Como propietario quiero transferir mi unidad para que otro figure como dueño.
Estimación: M Fase: F3

Scenario: Traspaso aprobado
  Given un propietario con unidad activa
  When inicia traspaso con contrato adjunto
  And el admin aprueba
  Then se crea nuevo ownership activo
  And el anterior pasa a transferred

👷 M04 — Staff & Payroll
US-M04-001 — Registrar trabajador
Como condo_admin quiero registrar trabajadores para gestionar nómina.
Estimación: S Fase: F7

Scenario: Creación con tipo individual
  Given un condo_admin autenticado
  When crea un trabajador con tipo individual
  Then el sistema pide cédula y no RIF
  And genera contrato con plantilla individual


US-M04-002 — Registrar asistencia
Como condo_admin quiero registrar asistencia diaria para calcular nómina.
Estimación: S Fase: F7

Scenario: Registro único por día
  Given un trabajador activo
  When registra asistencia el 2026-10-12
  Then se guarda el registro
  When intenta registrar otro el mismo día
  Then recibe 409 ASSISTANCE_ALREADY_REGISTERED

💸 M05 — Expenses & Suppliers
US-M05-001 — Registrar gasto
Como condo_admin quiero registrar un gasto para llevar control de egresos.
Estimación: S Fase: F6

Scenario: Gasto con comprobante
  Given un condo_admin
  When registra gasto con categoría "limpieza" y comprobante
  Then se guarda con estado pending
  And se refleja en reporte de gastos

💰 M06 — Billing
US-M06-001 — Generar cargos mensuales
Como condo_admin quiero generar los cargos del mes para facturar a las unidades.
Estimación: M Fase: F4

Scenario: Generación exitosa
  Given un condominio con 50 unidades y cuota ordinaria fija
  When ejecuta generación para 2026-10
  Then se crean 50 unit_charges con impuestos aplicados
  And no se duplican si se ejecuta de nuevo

US-M06-002 — Estado de cuenta por unidad
Como residente quiero ver mi estado de cuenta para saber qué debo.
Estimación: S Fase: F4

Scenario: Estado con deuda
  Given una unidad con 2 meses vencidos
  When el residente consulta su estado de cuenta
  Then ve los meses pendientes, mora aplicada y total

💳 M07 — Payments
US-M07-001 — Residente sube pago
Como residente quiero registrar un pago para saldar mis cuotas.
Estimación: M Fase: F5

Scenario: Selección de meses y comprobante
  Given un residente con 2 meses vencidos
  When selecciona enero y febrero
  And sube comprobante e ingresa referencia
  Then se crea pago en estado pending
  And el admin recibe notificación

US-M07-002 — Admin registra pago manual (nuevo)
Como condo_admin quiero registrar un pago en nombre del residente para no depender de que él lo haga.
Estimación: M Fase: F5

Scenario: Pago con todos los datos
  Given un condo_admin autenticado
  When registra pago con comprobante y referencia
  Then el pago queda en estado approved
  And se generan allocations a los cargos
  And el estado de cuenta refleja el pago

Scenario: Pago sin comprobante ni referencia
  Given un condo_admin autenticado
  When registra pago sin comprobante ni referencia
  Then el pago queda en estado approved_pending_data
  And pending_data_reason = "Sin comprobante ni número de transferencia"
  And el estado de cuenta refleja el pago
  And aparece en el filtro "Pendientes de datos"

US-M07-003 — Completar datos de pago pendiente (nuevo)
Como condo_admin quiero completar datos de un pago pendiente para cerrar el ciclo.
Estimación: S Fase: F5

Scenario: Completar con referencia
  Given un pago en approved_pending_data
  When el admin agrega referencia y comprobante
  Then el pago cambia a approved
  And se registra data_completed_at y data_completed_by

US-M07-004 — Aprobar pago del residente
Como condo_admin quiero aprobar un pago para aplicarlo al estado de cuenta.
Estimación: S Fase: F5

Scenario: Aprobación
  Given un pago en in_review con comprobante
  When el admin aprueba
  Then el pago pasa a approved
  And se aplican los meses seleccionados
  And el residente recibe notificación

US-M07-005 — Recibo PDF
Como residente quiero descargar mi recibo para tener constancia.
Estimación: S Fase: F5

Scenario: Descarga
  Given un pago aprobado
  When el residente descarga el recibo
  Then recibe PDF con detalle del pago
  And en approved_pending_data incluye nota de datos pendientes

🏦 M08 — Bank Reconciliation
US-M08-001 — Importar TXT Banesco
Como accountant quiero importar un TXT de Banesco para conciliar movimientos.
Estimación: M Fase: F8

Scenario: Importación exitosa
  Given un archivo TXT de Banesco delimitado por ;
  When lo subo
  Then se parsean los movimientos
  And se normalizan montos con coma decimal y punto de miles
  And se clasifican por categoría

US-M08-002 — Aprobar match sugerido
Como accountant quiero aprobar un match sugerido para vincular movimiento con pago.
Estimación: S Fase: F8

Scenario: Aprobación
  Given un movimiento con score 95
  When apruebo el match
  Then el movimiento queda matched
  And el pago se confirma

📄 M09 — Minutes
US-M09-001 — Crear acta
Como condo_admin quiero crear un acta para documentar incumplimiento.
Estimación: M Fase: F9

Scenario: Numeración consecutiva
  Given un condominio sin actas
  When creo la primera acta
  Then recibe número 1
  And al emitir se calcula hash de integridad

Scenario: Edición bloqueada tras emitir
  Given un acta emitida
  When intento editarla
  Then recibe 409 MINUTE_NOT_EDITABLE

🛠️ M10 — Incidents & Complaints
US-M10-001 — Registrar incidencia
Como residente quiero reportar una falla para que se solucione.
Estimación: S Fase: F9

Scenario: Incidencia con prioridad
  Given un residente autenticado
  When registra incidencia "ascensor averiado" con prioridad high
  Then se crea con estado open
  And el admin recibe notificación

US-M10-002 — Queja anónima
Como residente quiero quejarme de forma anónima para proteger mi identidad.
Estimación: M Fase: F9

Scenario: Queja sin identidad
  Given un residente autenticado
  When crea queja marcada como anónima
  Then reporter_user_id se guarda NULL en el registro público
  And el admin no ve la identidad

📊 M11 — Reports
US-M11-001 — Exportar estado de cuenta
Como condo_admin quiero exportar estados de cuenta para enviarlos a la junta.
Estimación: M Fase: F10

Scenario: Exportación a Excel
  Given un condominio con 50 unidades
  When solicito exportación de estado de cuenta a Excel
  Then recibo link de descarga
  And el archivo contiene los datos correctos

US-M11-002 — Reporte de pagos pendientes de datos (nuevo)
Como condo_admin quiero ver los pagos pendientes de datos para completarlos.
Estimación: S Fase: F10

Scenario: Listado de pagos pendientes
  Given pagos en approved_pending_data
  When abro el reporte
  Then veo unidad, período, monto, quién registró y motivo
  And puedo exportar a Excel o PDF

🛡️ M12 — Audit
US-M12-001 — Consultar auditoría
Como tenant_admin quiero consultar logs para auditar acciones.
Estimación: S Fase: F11

Scenario: Filtro por entidad
  Given un historial con múltiples mutaciones
  When filtro por entity=Payment y entityId
  Then veo todos los cambios sobre ese pago

M13 — Notifications
US-M13-001 — Notificación de pago aprobado
Como residente quiero recibir notificación para saber si mi pago fue aprobado.
Estimación: M Fase: F10

Scenario: Push + WhatsApp
  Given un pago aprobado
  When el sistema procesa el evento
  Then el residente recibe push y WhatsApp con resumen
  And en approved_pending_data recibe aviso de datos pendientes

Scenario: Recibo adjunto
  Given un pago aprobado
  When se envía el WhatsApp
  Then el recibo PDF se adjunta o se envía por link

US-M13-002 — Recordatorio de pago
Como residente quiero recordatorio antes del vencimiento para pagar a tiempo.
Estimación: S Fase: F10

Scenario: 3 días antes
  Given una cuota con due_date en 3 días
  When el sistema ejecuta el job
  Then el residente recibe recordatorio por WhatsApp

US-M13-003 — Recordatorio de pago pendiente de datos (nuevo)
Como condo_admin quiero recordatorio de pagos pendientes para no olvidarlos.
Estimación: S Fase: F10

Scenario: Recordatorio semanal
  Given un pago en approved_pending_data con 7 días
  When el sistema ejecuta el job
  Then el admin recibe recordatorio push



📌 Priorización MoSCoW
Must
Todas las US de M01, M02, M03, M06, M07 (núcleo).

Pagos asistidos por admin + approved_pending_data.

Multi-tenant y RBAC.

Should
M04, M05, M08, M09, M10, M11, M13.

Could
Reportes avanzados, conciliación multi-banco.

Won't (v1)
Ver 17-FUTURE-SCOPE.md.

