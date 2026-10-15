---
id: M10-INCIDENTS-COMPLAINTS
title: Módulo Incidents & Complaints
version: 1.0
status: active
depends_on: [M01-IDENTITY, M02-CONDOMINIUMS, M03-PROPERTIES-RESIDENTS]
used_by_agent_when: "incidencias en instalaciones, quejas anónimas o identificadas, asignación a proveedor o personal"
last_updated: 2026-10-12
---

# M10 — Incidents & Complaints

## 1. Propósito

Registrar incidencias en instalaciones y quejas entre residentes o contra el condominio. Permite asignación a personal/proveedor y respuestas.

## 2. Entidades que posee

| Entidad | Descripción | Tabla |
|---|---|---|
| Incident | Falla en instalaciones | `incidents` |
| Complaint | Queja formal o anónima | `complaints` |

## 3. Requerimientos funcionales

| ID | Descripción | Prioridad | Fase |
|---|---|---|---|
| RF-M10-001 | Registrar incidencia con área y prioridad | Must | F9 |
| RF-M10-002 | Adjuntar archivos a incidencia | Should | F9 |
| RF-M10-003 | Asignar a personal o proveedor | Must | F9 |
| RF-M10-004 | Estados de incidencia | Must | F9 |
| RF-M10-005 | Registrar queja identificada | Must | F9 |
| RF-M10-006 | Registrar queja anónima | Must | F9 |
| RF-M10-007 | Queja contra residente o condominio | Must | F9 |
| RF-M10-008 | Responder queja | Must | F9 |
| RF-M10-009 | Notificar actualizaciones | Should | F9 |
| RF-M10-010 | Filtros por estado, prioridad, fecha | Should | F9 |

## 4. Endpoints

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/api/v1/incidents` | `incidents:incident.list` | Listar |
| POST | `/api/v1/incidents` | `incidents:incident.create` | Crear |
| PATCH | `/api/v1/incidents/:id` | `incidents:incident.update` | Editar |
| PATCH | `/api/v1/incidents/:id/assign` | `incidents:incident.assign` | Asignar |
| PATCH | `/api/v1/incidents/:id/resolve` | `incidents:incident.resolve` | Resolver |
| GET | `/api/v1/complaints` | `complaints:complaint.list` | Listar |
| POST | `/api/v1/complaints` | `complaints:complaint.create` | Crear |
| PATCH | `/api/v1/complaints/:id` | `complaints:complaint.update` | Editar |
| POST | `/api/v1/complaints/:id/respond` | `complaints:complaint.respond` | Responder |
| PATCH | `/api/v1/complaints/:id/close` | `complaints:complaint.close` | Cerrar |

## 5. Reglas de negocio aplicables

- BR-037 (quejas anónimas)
- BR-052 (auditoría)

## 6. Eventos

### Emitidos
| Evento | Cuándo | Payload |
|---|---|---|
| `incidents.incident.created.v1` | Creación | `{ incidentId, area, priority }` |
| `incidents.incident.resolved.v1` | Resolución | `{ incidentId, resolvedBy }` |
| `complaints.complaint.created.v1` | Queja | `{ complaintId, anonymous }` |
| `complaints.complaint.responded.v1` | Respuesta | `{ complaintId, responderId }` |

### Consumidos
Ninguno.

## 7. Dependencias

| Módulo | Cómo | Uso |
|---|---|---|
| M01 | Facade | Permisos |
| M02 | Facade | Condominio |
| M03 | Facade | Personas y unidades |
| M04 | Facade | Asignar a staff |
| M05 | Facade | Asignar a proveedor |
| M13 | Facade | Notificaciones |

## 8. Permisos

| Rol | Acciones |
|---|---|
| `tenant_admin` | `incidents:*`, `complaints:*` |
| `condo_admin` | `incidents:*`, `complaints:*` |
| `board_member` | `incidents:incident.list`, `complaints:complaint.list` |
| `resident` | `incidents:incident.create`, `complaints:complaint.create` |

## 9. Estados y transiciones

### Incident
open → in_progress → resolved → closed


### Complaint
open → in_review → resolved
open → dismissed


## 10. Casos borde

- Queja anónima: admin no ve identidad del reportero.
- Queja contra condominio: se registra sin `target_person_id`.
- Incidencia duplicada (misma área, mismo día) → advertencia.
- Asignación a staff inactivo → bloqueado.
- Resolución sin comentario → permitido pero se advierte.

## 11. Fuera de alcance del módulo

- SLA y tiempos de respuesta (v2).
- Escalado automático (v2).
- Encuestas de satisfacción (v2).

## 12. Criterios de aceptación

- [ ] Se registra incidencia con prioridad y área.
- [ ] Se asigna a staff o proveedor.
- [ ] Queja anónima preserva identidad.
- [ ] Respuestas se registran y notifican.
- [ ] Filtros funcionan correctamente.