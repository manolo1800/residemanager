---
id: DOC-INDEX
title: Índice maestro de documentación del proyecto SGC
version: 1.0
audience: human+agent
last_updated: 2026-10-12
---

# 📚 Índice de Documentación — SGC

Este directorio contiene la documentación del producto **SGC** (SaaS de Gestión de Condominios).
Las instrucciones operativas para agentes IA viven en `.agent/` y `AGENTS.md` (raíz).

---

## 🗂️ Mapa de archivos

| ID | Archivo | Contenido |
|---|---|---|
| 00 | `00-INDEX.md` | Este archivo — mapa general |
| 01 | `01-CONTEXT.md` | Visión, alcance, actores, glosario |
| 02 | `02-ARCHITECTURE.md` | Monorepo, monolito modular, multi-tenancy |
| 03 | `03-TECH-STACK.md` | Stack cerrado y versiones |
| 04 | `04-DATA-MODEL.md` | Modelo entidad-relación, DDL, enums, índices |
| 05 | `05-SECURITY-MULTITENANCY.md` | RLS, JWT, RBAC, auditoría, soft delete |
| 06 | `06-DESIGN-SYSTEM.md` | Paleta, tokens, componentes, personalización |
| 07 | `07-BUSINESS-RULES.md` | Todas las reglas parametrizables del negocio |
| 08 | `08-ROADMAP.md` | Fases 0-12, entregables, dependencias |
| 09 | `09-CONVENTIONS.md` | Naming, estructura, commits, PRs |
| 10 | `10-I18N.md` | Locales, formatos, timezone |
| 11 | `11-MODULES/` | Documentación por módulo funcional |
| 12 | `12-API-CONTRACTS.md` | Estándares REST, errores, idempotencia, Scalar |
| 13 | `13-TESTING-QA.md` | Estrategia, cobertura, escenarios críticos |
| 14 | `14-DEPLOYMENT-OPS.md` | Entornos, Docker, CI/CD, observabilidad |
| 15 | `15-USER-STORIES.md` | Backlog en Gherkin |
| 16 | `16-ADR.md` | Decisiones arquitectónicas registradas |
| 17 | `17-FUTURE-SCOPE.md` | Qué NO construir en v1 |

---

## 🧭 Si la tarea es X → lee los archivos Y

| Tarea | Archivos |
|---|---|
| Entender el producto | 01, 02, 07 |
| Entender la arquitectura | 02, 03, 16 |
| Crear/alterar el modelo de datos | 04, 05, 16 |
| Implementar un módulo | 02, 03, 04, 05, 07, 09, 11/M0X, 12, 15 |
| Ajustar UI | 06, 10, 11/M0X |
| Agregar endpoint | 03, 05, 09, 11/M0X, 12 |
| Definir tests | 13, 15, 11/M0X |
| Deploy | 14, 03 |
| Resolver una duda arquitectónica | 02, 16 |
| Saber si algo está en alcance | 17 |

---

## 🚦 Estado del proyecto

| Fase | Nombre | Estado |
|---|---|---|
| F0 | Fundaciones | ⏳ Pendiente |
| F1 | Identidad, tenants y multi-condominio | ⏳ Pendiente |
| F2 | Estructura física y propiedades | ⏳ Pendiente |
| F3 | Residentes y vinculación | ⏳ Pendiente |
| F4 | Cobranza | ⏳ Pendiente |
| F5 | Pagos, comprobantes, recibos | ⏳ Pendiente |
| F6 | Gastos y proveedores | ⏳ Pendiente |
| F7 | Personal, nómina, asistencia | ⏳ Pendiente |
| F8 | Conciliación bancaria | ⏳ Pendiente |
| F9 | Actas, incidencias, quejas | ⏳ Pendiente |
| F10 | Reportes y notificaciones | ⏳ Pendiente |
| F11 | Auditoría, seguridad, performance | ⏳ Pendiente |
| F12 | Futuro (post-v1) | 🔒 Bloqueado |

Detalle completo en `docs/08-ROADMAP.md`.

---

## 🔖 Convenciones de IDs

| Prefijo | Tipo | Ejemplo |
|---|---|---|
| `RF-M0X-NNN` | Requerimiento funcional | `RF-M07-003` |
| `RNF-NNN` | Requerimiento no funcional | `RNF-012` |
| `BR-NNN` | Regla de negocio | `BR-014` |
| `US-M0X-NNN` | Historia de usuario | `US-M07-012` |
| `ADR-NNN` | Decisión arquitectónica | `ADR-007` |
| `M0X` | Módulo funcional | `M07` (pagos) |

Los IDs **nunca se reutilizan** aunque un ítem se elimine.

---

## 🔗 Documentos relacionados

- Instrucciones del agente: `AGENTS.md` (raíz) y `.agent/`
- Reglas duras: `.agent/context.md` y `.agent/boundaries.md`
- Checklist de PR: `.agent/pr-checklist.md`