---
id: AGENT-PROMPT-NEW-MODULE
title: Prompt — Crear un módulo nuevo
version: 1.0
audience: agent
used_by_agent_when: "cuando el usuario pide un módulo nuevo"
---

# `.agent/prompts/new-module.md`

## 🎯 Cuándo usarlo

Cuando el usuario pide algo tipo:
- "Agrega un módulo de reservas de áreas comunes."
- "Necesito un módulo para gestionar visitantes."
- "Crea un módulo de mantenimiento preventivo."

---

## 🚦 Protocolo obligatorio

### Paso 1 — Verificar si está en alcance

- ¿Aparece en `docs/08-ROADMAP.md`? → seguir.
- ¿Aparece en `docs/17-FUTURE-SCOPE.md`? → **detente y pregunta**.
- ¿No aparece en ninguno? → **pregunta antes de continuar**.

### Paso 2 — Cargar contexto

Lee en este orden:
1. `AGENTS.md`
2. `.agent/context.md`
3. `.agent/coding-standards.md`
4. `docs/02-ARCHITECTURE.md`
5. `docs/04-DATA-MODEL.md`
6. `docs/05-SECURITY-MULTITENANCY.md`
7. `docs/07-BUSINESS-RULES.md`
8. `docs/09-CONVENTIONS.md`
9. `docs/12-API-CONTRACTS.md`
10. `docs/11-MODULES/_TEMPLATE.md`

### Paso 3 — Definir alcance

Antes de escribir código, responde:
- ¿Qué problema resuelve?
- ¿Qué entidades nuevas necesita?
- ¿Qué reglas de negocio aplica?
- ¿Qué módulos existentes toca? (solo por facade/eventos)
- ¿Qué permisos necesita?
- ¿Qué endpoints expone?
- ¿Qué eventos emite y consume?
- ¿Qué queda **fuera** del módulo?

### Paso 4 — Plan (proponer al usuario)

Presenta:
Plan de módulo: <nombre>

Entidades nuevas:

X

Y

Endpoints:

POST /api/v1/<recurso>

GET /api/v1/<recurso>

...

Reglas de negocio aplicables:

BR-XXX

BR-YYY

Dependencias:

Módulo identity (facade) → autenticación

Módulo audit (evento) → auditoría

Fuera de alcance:

...


Espera aprobación **antes de escribir código**.

### Paso 5 — Implementar

Estructura obligatoria:
modules/<module-name>/
├── <module-name>.module.ts
├── <module-name>.facade.ts
├── application/
│ ├── services/
│ └── dto/
├── domain/
│ ├── entities/
│ ├── value-objects/
│ └── events/
├── infrastructure/
│ ├── repositories/
│ ├── persistence/
│ └── external/
└── presentation/
├── controllers/
└── guards/


Reglas:
- Nada fuera del facade es público.
- Repositorios usan Drizzle.
- DTOs con Zod.
- Guards con permisos.
- Eventos versionados.

### Paso 6 — Tests

Obligatorios:
- Unit tests de dominio.
- Integration test de cada endpoint.
- E2E del flujo principal.
- Test de aislamiento multi-tenant.

### Paso 7 — Documentación

Crear `docs/11-MODULES/MXX-<NOMBRE>.md` usando `_TEMPLATE.md`.

Actualizar:
- `docs/04-DATA-MODEL.md` (si hay entidades nuevas).
- `docs/12-API-CONTRACTS.md` (si hay endpoints nuevos).
- `docs/15-USER-STORIES.md` (US relacionadas).
- `.agent/task-router.md` (nueva fila).

### Paso 8 — Checklist

Correr `.agent/pr-checklist.md`.

---

## 📋 Plantilla de respuesta esperada
Plan del módulo: <nombre>
Contexto
<1 párrafo>

Entidades nuevas
<lista con columnas clave>

Endpoints
<tabla>

Reglas de negocio
<IDs de BR aplicables>

Permisos
<roles × acciones>

Eventos
<emitidos / consumidos>

Fuera de alcance
<lista>

Estimación
S / M / L

¿Apruebas el plan antes de implementar?
---

## 🚫 Errores comunes

- Empezar a codear sin proponer plan.
- Crear entidades sin `tenant_id`.
- Exponer entidades internas en el facade.
- Endpoints sin permisos.
- Strings hardcodeados.
- Sin tests.
- Sin actualizar docs.

---

## ✅ Señales de que salió bien

- Otro módulo puede usar el nuevo solo importando su facade.
- El módulo se puede extraer a microservicio sin refactor.
- Los tests cubren casos borde.
- La doc refleja el estado real.