---
id: M09-MINUTES
title: Módulo Minutes (Actas)
version: 1.0
status: active
depends_on: [M01-IDENTITY, M02-CONDOMINIUMS, M03-PROPERTIES-RESIDENTS]
used_by_agent_when: "actas, sanciones, asambleas, documentos formales con numeración consecutiva"
last_updated: 2026-10-12
---

# M09 — Minutes (Actas)

## 1. Propósito

Gestión de actas formales: por incumplimiento a residentes, decisiones de asamblea y sanciones. Numeración consecutiva por condominio, hash de integridad, notificación al involucrado.

## 2. Entidades que posee

| Entidad | Descripción | Tabla |
|---|---|---|
| Minute | Acta formal | `minutes` |

## 3. Requerimientos funcionales

| ID | Descripción | Prioridad | Fase |
|---|---|---|---|
| RF-M09-001 | Crear acta por incumplimiento | Must | F9 |
| RF-M09-002 | Crear acta de asamblea | Must | F9 |
| RF-M09-003 | Crear acta de sanción | Must | F9 |
| RF-M09-004 | Numeración consecutiva por condominio | Must | F9 |
| RF-M09-005 | Adjuntar archivos | Should | F9 |
| RF-M09-006 | Hash de integridad (SHA-256) | Should | F9 |
| RF-M09-007 | Notificar al involucrado | Must | F9 |
| RF-M09-008 | Estados: draft, issued, notified, closed | Must | F9 |
| RF-M09-009 | PDF descargable | Should | F9 |
| RF-M09-010 | Búsqueda por unidad/persona/fecha | Should | F9 |

## 4. Endpoints

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/api/v1/minutes` | `minutes:minute.list` | Listar |
| GET | `/api/v1/minutes/:id` | `minutes:minute.read` | Detalle |
| POST | `/api/v1/minutes` | `minutes:minute.create` | Crear |
| PATCH | `/api/v1/minutes/:id` | `minutes:minute.update` | Editar (solo draft) |
| PATCH | `/api/v1/minutes/:id/issue` | `minutes:minute.issue` | Emitir |
| PATCH | `/api/v1/minutes/:id/notify` | `minutes:minute.notify` | Notificar |
| PATCH | `/api/v1/minutes/:id/close` | `minutes:minute.close` | Cerrar |
| GET | `/api/v1/minutes/:id/pdf` | `minutes:minute.read` | Descargar PDF |

## 5. Reglas de negocio aplicables

- BR-034 (numeración)
- BR-035 (estados)
- BR-036 (hash)
- BR-052 (auditoría)

## 6. Eventos

### Emitidos
| Evento | Cuándo | Payload |
|---|---|---|
| `minutes.minute.issued.v1` | Emisión | `{ minuteId, condominiumId, number }` |
| `minutes.minute.notified.v1` | Notificación | `{ minuteId, personId }` |
| `minutes.minute.closed.v1` | Cierre | `{ minuteId, resolution }` |

### Consumidos
Ninguno.

## 7. Dependencias

| Módulo | Cómo | Uso |
|---|---|---|
| M01 | Facade | Permisos |
| M02 | Facade | Condominio |
| M03 | Facade | Personas y unidades |
| M13 | Facade | Notificación al involucrado |

## 8. Permisos

| Rol | Acciones |
|---|---|
| `tenant_admin` | `minutes:*` |
| `condo_admin` | `minutes:*` |
| `board_member` | `minutes:minute.list`, `minutes:minute.read` |
| `resident` | `minutes:minute.read` (propias) |

## 9. Estados y transiciones
draft → issued → notified → closed


Regla: solo `draft` es editable.

## 10. Casos borde

- Edición de acta emitida → bloqueado.
- Notificación a persona sin cuenta → se registra intento y se documenta.
- Numeración salta si hay rollback → se implementa con secuencia DB.
- Adjunto excede tamaño máximo → error 413.
- Hash cambia si se altera el contenido → bloquea edición.

## 11. Fuera de alcance del módulo

- Firma digital (v2).
- Aprobación de acta por asamblea en el sistema (v2).

## 12. Criterios de aceptación

- [ ] Se crea acta y se asigna número consecutivo.
- [ ] Emitir genera hash.
- [ ] Notificación llega al involucrado.
- [ ] Edición bloqueada tras emitir.
- [ ] PDF descargable.
- [ ] Búsqueda filtra correctamente.