---
id: M03-PROPERTIES-RESIDENTS
title: Módulo Properties & Residents
version: 1.0
status: active
depends_on: [M01-IDENTITY, M02-CONDOMINIUMS]
used_by_agent_when: "vinculación de residentes, propiedades, traspasos, historial de propietarios, residentes multi-condominio"
last_updated: 2026-10-12
---

# M03 — Properties & Residents

## 1. Propósito

Gestiona personas, propietarios, residentes, vinculaciones con unidades y traspasos de propiedad. Un residente puede tener propiedades en varios condominios del mismo tenant.

## 2. Entidades que posee

| Entidad | Descripción | Tabla |
|---|---|---|
| Person | Persona física (propietario o residente) | `persons` |
| UnitOwnership | Relación persona↔unidad | `unit_ownerships` |
| OwnershipTransfer | Traspaso de propiedad | `ownership_transfers` |
| ResidentLinkRequest | Solicitud de vinculación | `resident_link_requests` |
| ResidentProfile | Perfil de residente | `resident_profiles` |

## 3. Requerimientos funcionales

| ID | Descripción | Prioridad | Fase |
|---|---|---|---|
| RF-M03-001 | Registro de residente | Must | F3 |
| RF-M03-002 | Búsqueda de residencia por nombre | Must | F3 |
| RF-M03-003 | Visualización de coincidencias con dirección | Must | F3 |
| RF-M03-004 | Vinculación a unidad con código | Must | F3 |
| RF-M03-005 | Aprobación/rechazo de vinculación por admin | Must | F3 |
| RF-M03-006 | Multi-propiedad por residente | Must | F3 |
| RF-M03-007 | Traspaso con contrato adjunto | Must | F3 |
| RF-M03-008 | Aprobación de traspaso por admin | Must | F3 |
| RF-M03-009 | Historial de propietarios por unidad | Must | F3 |
| RF-M03-010 | Solo condo_admin principal crea admins | Must | F3 |
| RF-M03-011 | Edición de datos de persona | Should | F3 |
| RF-M03-012 | Ver propiedades propias | Must | F3 |

## 4. Endpoints

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/api/v1/persons` | `properties:person.list` | Listar personas del condominio |
| POST | `/api/v1/persons` | `properties:person.create` | Crear persona |
| PATCH | `/api/v1/persons/:id` | `properties:person.update` | Editar |
| GET | `/api/v1/units/:id/ownerships` | `properties:ownership.list` | Historial de propietarios |
| POST | `/api/v1/units/:id/ownerships` | `properties:ownership.create` | Asignar propietario |
| POST | `/api/v1/ownerships/:id/transfer` | `properties:transfer.create` | Iniciar traspaso |
| PATCH | `/api/v1/transfers/:id/approve` | `properties:transfer.approve` | Aprobar traspaso |
| PATCH | `/api/v1/transfers/:id/reject` | `properties:transfer.reject` | Rechazar traspaso |
| GET | `/api/v1/resident-link-requests` | `residents:link.list` | Solicitudes pendientes |
| POST | `/api/v1/resident-link-requests` | público (residente) | Crear solicitud |
| PATCH | `/api/v1/resident-link-requests/:id/approve` | `residents:link.approve` | Aprobar |
| PATCH | `/api/v1/resident-link-requests/:id/reject` | `residents:link.reject` | Rechazar |
| GET | `/api/v1/me/properties` | autenticado | Propiedades propias |

## 5. Reglas de negocio aplicables

- BR-031 (vinculación residente)
- BR-032 (traspaso de propiedad)
- BR-033 (multi-propiedad)
- BR-051, BR-052, BR-053

## 6. Eventos

### Emitidos
| Evento | Cuándo | Payload |
|---|---|---|
| `residents.link.requested.v1` | Solicitud creada | `{ requestId, userId, condominiumId, unitCode }` |
| `residents.link.approved.v1` | Aprobada | `{ requestId, ownershipId }` |
| `residents.link.rejected.v1` | Rechazada | `{ requestId, reason }` |
| `properties.ownership.transferred.v1` | Traspaso aprobado | `{ unitId, fromPersonId, toPersonId }` |

### Consumidos
| Evento | Origen | Acción |
|---|---|---|
| `condominiums.unit.created.v1` | M02 | Actualiza índice de unidades disponibles |

## 7. Dependencias

| Módulo | Cómo | Uso |
|---|---|---|
| M01 | Facade | Identidad y permisos |
| M02 | Facade | Unidades y condominios |

## 8. Permisos

| Rol | Acciones |
|---|---|
| `tenant_admin` | `properties:*`, `residents:*` |
| `condo_admin` | `properties:*`, `residents:*` |
| `board_member` | `properties:person.list`, `properties:ownership.list` |
| `resident` | `residents:link.create` (solo propias), `me:properties.list` |
| `accountant` | `properties:person.list`, `properties:ownership.list` |

## 9. Estados y transiciones

### ResidentLinkRequest
pending → approved
pending → rejected


### OwnershipTransfer
pending → approved
pending → rejected


### UnitOwnership
active → transferred
active → inactive


## 10. Casos borde

- Residente intenta vincularse a unidad ya ocupada → rechazo automático con aviso.
- Traspaso sin contrato adjunto → bloqueado.
- Unidad con propietario y residente distintos → permitido.
- Multi-propiedad: residente con 3 unidades en 2 condominios.
- Persona con documento duplicado en el mismo tenant → 409.
- Cambio de propietario con cuotas pendientes → permitido, la deuda sigue a la unidad.
- Rechazo de vinculación → usuario puede reenviar tras corrección.

## 11. Fuera de alcance del módulo

- Firma digital del contrato de traspaso (v2).
- Validación de identidad con documentos oficiales (v2).
- Historial financiero al momento del traspaso (v2).

## 12. Criterios de aceptación

- [x] Residente busca por nombre y ve coincidencias con dirección.
- [x] Solicita vinculación con código de unidad.
- [x] Admin aprueba y se crea ownership.
- [x] Residente ve su propiedad en `/me/properties`.
- [x] Traspaso con contrato adjunto.
- [x] Admin aprueba y se actualiza historial.
- [x] No se permite vincular a unidad ya ocupada por otro propietario activo.