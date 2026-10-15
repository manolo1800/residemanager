---
id: M02-CONDOMINIUMS
title: Módulo Condominiums
version: 1.0
status: active
depends_on: [M01-IDENTITY]
used_by_agent_when: "crear/editar condominios, edificios, bloques, casas, unidades, áreas comunes, estacionamientos, configuración por condominio"
last_updated: 2026-10-12
---

# M02 — Condominiums

## 1. Propósito

Representa la realidad física y configurable de cada condominio: tipo, estructuras, unidades, áreas comunes, estacionamientos y configuración operativa (monedas, impuestos, mora, colores).

## 2. Entidades que posee

| Entidad | Descripción | Tabla |
|---|---|---|
| Condominium | Entidad raíz | `condominiums` |
| CondoStructure | Edificio / bloque / etapa | `condo_structures` |
| Unit | Apartamento o casa | `units` |
| CommonArea | Parque, piscina, etc. | `common_areas` |
| ParkingSpot | Puesto de estacionamiento | `parking_spots` |
| CondominiumSetting | Configuración clave-valor | `condominium_settings` |
| TermsAndConditions | Términos del sistema o del condominio | `terms_and_conditions` |

## 3. Requerimientos funcionales

| ID | Descripción | Prioridad | Fase |
|---|---|---|---|
| RF-M02-001 | Alta de condominio tipo `buildings` | Must | F2 |
| RF-M02-002 | Alta de condominio tipo `houses` | Must | F2 |
| RF-M02-003 | Creación de estructuras (edificios/bloques/etapas) | Must | F2 |
| RF-M02-004 | Nomenclatura de unidades configurable | Must | F2 |
| RF-M02-005 | Registro de áreas comunes (opcional) | Should | F2 |
| RF-M02-006 | Registro de estacionamientos (opcional) | Should | F2 |
| RF-M02-007 | Código identificador único por condominio | Must | F2 |
| RF-M02-008 | Configuración de moneda base y extranjera | Must | F2 |
| RF-M02-009 | Configuración de impuestos | Must | F2 |
| RF-M02-010 | Configuración de mora | Must | F2 |
| RF-M02-011 | Configuración de cuota (fija/variable) | Must | F2 |
| RF-M02-012 | Configuración de colores, logo, favicon | Must | F1 |
| RF-M02-013 | Términos propios del condominio | Should | F1 |
| RF-M02-014 | Zona horaria y formato de fecha | Must | F1 |
| RF-M02-015 | Importador masivo de unidades (CSV) | Should | F2 |
| RF-M02-016 | Activar/desactivar condominio (soft) | Must | F2 |

## 4. Endpoints

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/api/v1/condominiums` | `condominiums:condo.list` | Listar condominios del tenant |
| POST | `/api/v1/condominiums` | `condominiums:condo.create` | Crear condominio |
| GET | `/api/v1/condominiums/:id` | `condominiums:condo.read` | Detalle |
| PATCH | `/api/v1/condominiums/:id` | `condominiums:condo.update` | Editar |
| DELETE | `/api/v1/condominiums/:id` | `condominiums:condo.deactivate` | Soft delete |
| GET | `/api/v1/condominiums/:id/structures` | `condominiums:structure.list` | Estructuras |
| POST | `/api/v1/condominiums/:id/structures` | `condominiums:structure.create` | Crear estructura |
| GET | `/api/v1/condominiums/:id/units` | `condominiums:unit.list` | Unidades |
| POST | `/api/v1/condominiums/:id/units` | `condominiums:unit.create` | Crear unidad |
| POST | `/api/v1/condominiums/:id/units/import` | `condominiums:unit.import` | Importar CSV |
| GET | `/api/v1/condominiums/:id/common-areas` | `condominiums:area.list` | Áreas comunes |
| POST | `/api/v1/condominiums/:id/common-areas` | `condominiums:area.create` | Crear área |
| GET | `/api/v1/condominiums/:id/parking-spots` | `condominiums:parking.list` | Estacionamientos |
| PATCH | `/api/v1/condominiums/:id/settings` | `condominiums:settings.update` | Configuración |
| GET | `/api/v1/condominiums/search` | autenticado | Búsqueda pública por nombre (para residentes) |

## 5. Reglas de negocio aplicables

- BR-001, BR-002, BR-003 (cuotas)
- BR-004 (impuestos)
- BR-005 (multimoneda)
- BR-006 (mora)
- BR-007 (pagos parciales)
- BR-028 (tipo de condominio)
- BR-029 (nomenclatura)
- BR-030 (código identificador)
- BR-041 (personalización visual)
- BR-042 (políticas propias)
- BR-043 (zona horaria)
- BR-044 (formato de fecha)

## 6. Eventos

### Emitidos
| Evento | Cuándo | Payload |
|---|---|---|
| `condominiums.condo.created.v1` | Alta | `{ condominiumId, tenantId, type }` |
| `condominiums.condo.updated.v1` | Cambio | `{ condominiumId, changes }` |
| `condominiums.settings.updated.v1` | Config | `{ condominiumId, keys }` |
| `condominiums.unit.created.v1` | Nueva unidad | `{ unitId, condominiumId }` |

### Consumidos
Ninguno.

## 7. Dependencias

| Módulo | Cómo | Uso |
|---|---|---|
| M01 | Facade | Validar tenant y permisos |

## 8. Permisos

| Rol | Acciones |
|---|---|
| `super_admin` | Todas |
| `tenant_admin` | Todas las de `condominiums:*` |
| `condo_admin` | `condominiums:condo.read`, `condominiums:condo.update`, `condominiums:structure.*`, `condominiums:unit.*`, `condominiums:settings.update` |
| `board_member` | `condominiums:condo.read`, `condominiums:unit.list` |
| `resident` | `condominiums:condo.read` (solo el suyo) |
| `accountant` | `condominiums:condo.read` |

## 9. Estados y transiciones

### Condominium
active → inactive
inactive → active


### Unit
active → inactive
inactive → active


## 10. Casos borde

- Código de condominio duplicado dentro del mismo tenant → 409.
- Cambio de tipo de condominio (`buildings` → `houses`) con unidades existentes → bloqueado.
- Cambio de moneda base con cargos activos → requiere confirmación y recalculo.
- Desactivar condominio con cuotas pendientes → bloqueado hasta resolver.
- Importar CSV con unidades duplicadas → validar y rechazar filas.
- Eliminar estructura con unidades asignadas → bloqueado.

## 11. Fuera de alcance del módulo

- Reserva de áreas comunes (v2).
- Asignación de estacionamientos a unidades (v2).
- Alícuota por unidad (v2).
- Geolocalización y mapas (v2).

## 12. Criterios de aceptación

- [ ] Se crea un condominio tipo edificios con N pisos.
- [ ] Se crea un condominio tipo casas con bloques y cantidad.
- [ ] El código identificador es único por tenant.
- [ ] La configuración de impuestos se aplica correctamente en cobranza.
- [ ] La personalización visual persiste y se aplica.
- [ ] Búsqueda por nombre devuelve coincidencias con dirección.
- [ ] Import CSV procesa y rechaza filas inválidas con reporte.