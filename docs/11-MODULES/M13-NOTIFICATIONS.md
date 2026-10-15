---
id: M13-NOTIFICATIONS
title: Módulo Notifications
version: 1.0
status: active
depends_on: [M01-IDENTITY]
used_by_agent_when: "push Firebase, WhatsApp Baileys, plantillas de notificación, envío de recibos"
last_updated: 2026-10-12
---

# M13 — Notifications

## 1. Propósito

Envía notificaciones push (Firebase) y WhatsApp (Baileys) a usuarios. Gestiona plantillas por idioma y colas de envío.

## 2. Entidades que posee

| Entidad | Descripción | Tabla |
|---|---|---|
| Notification | Notificación enviada/pendiente | `notifications` |
| NotificationTemplate | Plantilla por locale y canal | `notification_templates` |

## 3. Requerimientos funcionales

| ID | Descripción | Prioridad | Fase |
|---|---|---|---|
| RF-M13-001 | Envío de push vía Firebase | Must | F10 |
| RF-M13-002 | Envío de WhatsApp vía Baileys | Must | F10 |
| RF-M13-003 | Plantillas por locale (4 idiomas) | Must | F10 |
| RF-M13-004 | Cola de envío con reintentos | Must | F10 |
| RF-M13-005 | Registro de envío (estado, error) | Must | F10 |
| RF-M13-006 | Envío de PDF adjunto (recibos) | Must | F10 |
| RF-M13-007 | Preferencias de notificación por usuario | Should | F10 |
| RF-M13-008 | Recordatorios de pago programados | Must | F10 |
| RF-M13-009 | Notificación de pago aprobado/rechazado | Must | F10 |
| RF-M13-010 | Notificación de pago pendiente de datos | Must | F10 |
| RF-M13-011 | Reintentos con backoff | Should | F10 |
| RF-M13-012 | Idempotencia en envíos | Must | F10 |

## 4. Endpoints

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/api/v1/notifications` | `notifications:notification.list` | Listar propias |
| PATCH | `/api/v1/notifications/:id/read` | autenticado | Marcar leída |
| GET | `/api/v1/notification-templates` | `notifications:template.list` | Plantillas |
| POST | `/api/v1/notification-templates` | `notifications:template.create` | Crear plantilla |
| PATCH | `/api/v1/notification-templates/:id` | `notifications:template.update` | Editar |
| POST | `/api/v1/notifications/test` | `notifications:test.send` | Enviar prueba |

## 5. Reglas de negocio aplicables

- BR-048 (eventos notificables)
- BR-049 (canales)
- BR-050 (idiomas)

## 6. Eventos

### Emitidos
| Evento | Cuándo | Payload |
|---|---|---|
| `notifications.push.sent.v1` | Push enviado | `{ notificationId, userId }` |
| `notifications.push.failed.v1` | Fallo push | `{ notificationId, error }` |
| `notifications.whatsapp.sent.v1` | WhatsApp enviado | `{ notificationId, phone }` |
| `notifications.whatsapp.failed.v1` | Fallo WhatsApp | `{ notificationId, error }` |

### Consumidos
| Evento | Origen | Acción |
|---|---|---|
| `payments.payment.approved.v1` | M07 | Notifica aprobación |
| `payments.payment.approved_pending_data.v1` | M07 | Notifica con aviso |
| `payments.payment.rejected.v1` | M07 | Notifica rechazo |
| `payments.payment.data_completed.v1` | M07 | Notifica datos completos |
| `billing.charges.generated.v1` | M06 | Notifica cuotas emitidas |
| `billing.charge.overdue.v1` | M06 | Recordatorio de pago |
| `minutes.minute.issued.v1` | M09 | Notifica acta |
| `incidents.incident.created.v1` | M10 | Notifica al asignado |
| `complaints.complaint.responded.v1` | M10 | Notifica al reportero |

## 7. Dependencias

| Módulo | Cómo | Uso |
|---|---|---|
| M01 | Facade | Identidad y permisos |
| Todos | Evento | Recibe eventos de dominio |

## 8. Permisos

| Rol | Acciones |
|---|---|
| `tenant_admin` | `notifications:*` |
| `condo_admin` | `notifications:template.*`, `notifications:test.send` |
| `resident` | `notifications:notification.list` (propias) |

## 9. Estados y transiciones

### Notification
pending → sent
pending → failed → (reintento) → sent


## 10. Casos borde

- Usuario sin token FCM → solo WhatsApp/email.
- WhatsApp sin sesión activa de Baileys → reintento con backoff.
- Plantilla sin traducción en locale del usuario → fallback a `es` o `en`.
- Envío duplicado mismo evento → idempotencia por `eventId`.
- Recibo PDF grande → upload a MinIO y envío por link.
- Sesión de Baileys caída → alerta al admin.

## 11. Fuera de alcance del módulo

- Email transaccional (v2).
- SMS (v2).
- Push a iOS sin app (v2).

## 12. Criterios de aceptación

- [ ] Push se envía y registra.
- [ ] WhatsApp se envía por Baileys.
- [ ] Plantillas existen en los 4 idiomas.
- [ ] Reintentos funcionan con backoff.
- [ ] Recibos PDF se adjuntan en WhatsApp.
- [ ] Idempotencia respetada.
- [ ] Estados de envío registrados.