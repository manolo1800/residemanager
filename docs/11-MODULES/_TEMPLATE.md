---
id: M0X-<NAME>
title: Módulo <Nombre>
version: 1.0
status: draft|active|deprecated
depends_on: [M0Y-..., M0Z-...]
used_by_agent_when: "<frase corta que describe cuándo cargarlo>"
last_updated: YYYY-MM-DD
---

# M0X — Módulo <Nombre>

## 1. Propósito

<1 párrafo describiendo qué hace el módulo y por qué existe.>

## 2. Entidades que posee

<Tabla de entidades. Referencia a `docs/04-DATA-MODEL.md`.>

| Entidad | Descripción | Tabla |
|---|---|---|
| ... | ... | ... |

## 3. Requerimientos funcionales

<Cada RF con ID único, descripción, prioridad, fase.>

| ID | Descripción | Prioridad | Fase |
|---|---|---|---|
| RF-M0X-001 | ... | Must | F? |
| RF-M0X-002 | ... | Should | F? |

## 4. Endpoints

<Tabla de endpoints expuestos. Referencia a `docs/12-API-CONTRACTS.md`.>

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | /api/v1/... | `module:action` | ... |

## 5. Reglas de negocio aplicables

<IDs de `docs/07-BUSINESS-RULES.md` que aplican.>

- BR-XXX
- BR-YYY

## 6. Eventos

### Emitidos
| Evento | Cuándo | Payload |
|---|---|---|
| `module.event.v1` | ... | { ... } |

### Consumidos
| Evento | Origen | Acción |
|---|---|---|
| `other.event.v1` | M0Y | ... |

## 7. Dependencias

| Módulo | Cómo | Uso |
|---|---|---|
| M0Y | Facade | ... |
| M0Z | Evento | ... |

## 8. Permisos

<Tabla de roles × acciones.>

| Rol | Acciones permitidas |
|---|---|
| `condo_admin` | `module:action1`, `module:action2` |
| `resident` | `module:action3` |

## 9. Estados y transiciones

<Si aplica. Diagrama de estados.>
draft → pending → approved → closed
↘ rejected


## 10. Casos borde

<Lista de casos límite conocidos.>

- ...
- ...

## 11. Fuera de alcance del módulo

<Qué NO hace este módulo.>

- ...
- ...

## 12. Criterios de aceptación

<Gherkin resumido o bullets.>

- [ ] ...
- [ ] ...