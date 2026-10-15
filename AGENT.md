---
id: AGENTS-ROOT
title: Punto de entrada universal para agentes IA
version: 1.0
audience: agent
---

# AGENTS.md — Proyecto SGC

> **Léeme primero. Siempre. Sin excepción.**

Este repositorio implementa **SGC**, un SaaS multi-tenant para gestión de condominios y residencias.
Este archivo es el punto de entrada para cualquier agente IA (Gemini, Claude, Codex, Cursor, Windsurf, Copilot).

---

## 🚦 Protocolo de arranque

Antes de escribir **una sola línea de código**:

1. Lee `.agent/context.md` — reglas duras, rol, flujos.
2. Consulta `.agent/task-router.md` — qué archivos de `docs/` cargar según tu tarea.
3. Sigue `.agent/coding-standards.md` — cómo se escribe código aquí.
4. Respeta `.agent/boundaries.md` — qué NO tocar ni construir.
5. Antes de entregar, corre `.agent/pr-checklist.md`.

---

## ⛔ Reglas duras (nunca violar)

- **Multi-tenant:** toda query filtra por `tenant_id` (y `condominium_id` si aplica). RLS activo.
- **Soft delete universal:** nunca `DELETE` físico. Solo `deleted_at` + `status`.
- **Aislamiento de módulos:** ningún módulo importa entidades ni repositorios de otro. Solo facade público o eventos.
- **i18n obligatorio:** ningún string de UI hardcodeado. Todo en `es/en/fr/pt`.
- **Stack cerrado:** no agregar librerías fuera de `docs/03-TECH-STACK.md`.
- **Alcance cerrado:** no implementar nada listado en `docs/17-FUTURE-SCOPE.md`.
- **Auditoría:** toda mutación pasa por el servicio de auditoría.
- **Fechas en UTC en BD**, renderizado según timezone del condominio.
- **Moneda:** todo monto guarda moneda + tipo de cambio + monto en moneda base.

---

## 🗂️ Dónde vive cada cosa

| Recurso | Ubicación |
|---|---|
| Documentación del producto | `docs/` |
| Instrucciones para el agente | `.agent/` |
| Reglas de negocio | `docs/07-BUSINESS-RULES.md` |
| Modelo de datos | `docs/04-DATA-MODEL.md` |
| Seguridad y tenancy | `docs/05-SECURITY-MULTITENANCY.md` |
| Contratos de API | `docs/12-API-CONTRACTS.md` |
| Backlog y Gherkin | `docs/15-USER-STORIES.md` |
| Decisiones arquitectónicas | `docs/16-ADR.md` |
| Roadmap por fases | `docs/08-ROADMAP.md` |

---

## 🧭 Cómo navegar este repo

- **Soy nuevo:** lee `.agent/context.md` → `docs/01-CONTEXT.md` → `docs/02-ARCHITECTURE.md`.
- **Voy a implementar algo:** `.agent/task-router.md` me dice qué leer.
- **Tengo dudas de arquitectura:** `docs/16-ADR.md` antes de proponer cambios.
- **No sé si algo está en alcance:** `docs/17-FUTURE-SCOPE.md`.

---

## 📌 Actualización de documentación

Si tocas código, **actualizas el `.md` correspondiente**. Sin excepción.
Si cambias comportamiento de un módulo → actualizas `docs/11-MODULES/M0X-*.md`.
Si cambias el modelo de datos → actualizas `docs/04-DATA-MODEL.md`.
Si agregas una decisión arquitectónica → agregas un ADR en `docs/16-ADR.md`.

---

## 🧠 Estilo de trabajo esperado

- **Piensa antes de codear.** Si la tarea es grande, propón plan antes de ejecutar.
- **Pregunta cuando hay ambigüedad de alcance o modelo de datos.** No inventes.
- **Prefiere explícito sobre implícito.** Nada de magia.
- **No rompas contratos públicos.** Si algo cambia, versiona.
- **Escribe tests junto al código.** Nunca después.