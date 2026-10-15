
---

## 🗂️ `docs/17-FUTURE-SCOPE.md`

```markdown
---
id: 17-FUTURE-SCOPE
title: Alcance futuro (post v1)
version: 1.0
audience: human+agent
last_updated: 2026-10-12
---

# 17 — Future Scope

> **Regla:** todo lo listado aquí **NO se implementa en v1**. Promoverlo requiere ADR explícito y actualización del roadmap.

---

## 🚫 Fuera de alcance v1

### 1. Integración tributaria y facturación fiscal
- Emisión de facturas fiscales.
- Cálculo de IVA/IGTF.
- Integración con SUNAVAL / SENIAT.
- Retenciones fiscales.
- Libros de compras y ventas.

**Motivo:** complejidad regulatoria. El sistema no está conectado a tributación en v1.

---

### 2. Pagos en línea con pasarela
- Integración con Stripe / MercadoPago / PayPal.
- Pago directo desde la app.
- Webhooks de pasarela.
- Conciliación automática con pasarela.

**Motivo:** en v1 el flujo es offline (comprobante subido).

---

### 3. Autenticación 2FA
- TOTP (Google Authenticator).
- SMS OTP.
- WebAuthn.

**Motivo:** no requerido en v1. Puede agregarse sin refactor.

---

### 4. Alícuota por unidad
- Cálculo de cuota por metros cuadrados.
- Cálculo por avalúo catastral.
- Distribución proporcional de gastos.

**Motivo:** el cliente decidió cuota fija/variable. Campos reservados en `units`.

---

### 5. App móvil nativa
- React Native o Flutter.
- Push nativo (aunque ya usamos FCM para notificaciones).
- Cámara integrada para comprobantes.
- Modo offline.

**Motivo:** v1 es web responsive + PWA opcional.

---

### 6. OCR de comprobantes
- Lectura automática de monto, referencia, banco.
- Prellenado del formulario de pago.

**Motivo:** complejidad y falsos positivos. v1 confía en aprobación humana.

---

### 7. Multi-región
- Deploy en múltiples regiones geográficas.
- Replicación de DB cross-region.
- Data residency por país.

**Motivo:** v1 es single-region (probablemente Venezuela).

---

### 8. Integraciones con ERP
- SAP, Odoo, Contabilidad.
- Exportación a formatos específicos.
- Sincronización bidireccional.

**Motivo:** no hay requerimiento actual.

---

## 🟡 Mejoras potenciales (nice-to-have)

Podrían implementarse en v1.x sin ADR mayor si el alcance está acotado:

- Modo oscuro en UI.
- Email transaccional (además de push/WhatsApp).
- Reserva de áreas comunes.
- Asignación de estacionamientos a unidades.
- Reportes programados por email.
- Dashboards interactivos.
- Encuestas de satisfacción de quejas.
- SLA de incidencias.
- Multi-moneda con más de 2 divisas.
- Cálculo de prestaciones sociales.
- Vacaciones y permisos formales del personal.
- Firma digital de contratos y actas.

Cada uno requiere:
- Evaluación de esfuerzo.
- Aprobación del cliente.
- Actualización del roadmap.

---

## 🔴 Explícitamente descartado

### Sistema de reservas de áreas comunes con pago
**Motivo:** fuera del foco actual de administración.

### Módulo de visitantes con QR
**Motivo:** no requerido por el cliente.

### Control de acceso físico (torniquetes, cerraduras)
**Motivo:** hardware, fuera de scope software.

### CCTV / monitoreo de cámaras
**Motivo:** hardware, fuera de scope software.

### Chat interno entre residentes
**Motivo:** puede derivar en conflictos. Existe módulo de quejas.

### Marketplace interno
**Motivo:** fuera del producto.

---

## 📌 Reglas para promover algo de esta lista

Para mover un ítem de "Future Scope" a implementación:

1. **Crear un ADR** documentando:
   - Contexto y necesidad.
   - Alternativas evaluadas.
   - Decisión y consecuencias.
   - Impacto en arquitectura.
2. **Actualizar `docs/08-ROADMAP.md`** agregando una nueva fase.
3. **Actualizar `docs/04-DATA-MODEL.md`** si hay entidades nuevas.
4. **Actualizar `docs/07-BUSINESS-RULES.md`** si hay reglas nuevas.
5. **Actualizar este archivo** moviendo el ítem de "fuera de alcance" a "en curso".
6. **Agregar user stories** en `docs/15-USER-STORIES.md`.

Nada de esto se hace sin aprobación explícita del stakeholder.

---

## 🔒 Regla dura para agentes

Si un agente recibe una tarea que toca algo de este documento:

1. **Detente.**
2. **Pregunta al usuario** si es un cambio de alcance autorizado.
3. Si lo es, exige el ADR correspondiente antes de codear.
4. Si no lo es, rehúsa la tarea y explica por qué.

Esta regla existe para proteger al proyecto de scope creep.

---

## 📅 Bitácora de promociones

| Ítem | Fecha promoción | ADR | Fase destino |
|---|---|---|---|
| (vacío) | — | — | — |

Actualizar esta tabla al promover cualquier ítem.