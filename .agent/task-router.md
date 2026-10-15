---
id: AGENT-TASK-ROUTER
title: Enrutador de tareas → archivos de contexto
version: 1.0
audience: agent
used_by_agent_when: "al inicio de cada tarea"
---

# `.agent/task-router.md`

> **Regla:** nunca cargues todos los docs. Carga solo los que la tarea requiere.

---

## 🎯 Tabla de enrutamiento

| Tipo de tarea | Archivos a leer (en orden) |
|---|---|
| Onboarding inicial | `AGENTS.md`, `.agent/context.md`, `docs/01-CONTEXT.md`, `docs/02-ARCHITECTURE.md`, `docs/03-TECH-STACK.md` |
| Nuevo módulo completo | `AGENTS.md`, `.agent/context.md`, `docs/02-ARCHITECTURE.md`, `docs/04-DATA-MODEL.md`, `docs/05-SECURITY-MULTITENANCY.md`, `docs/07-BUSINESS-RULES.md`, `docs/09-CONVENTIONS.md`, `.agent/prompts/new-module.md` |
| Nuevo endpoint | `AGENTS.md`, `docs/03-TECH-STACK.md`, `docs/05-SECURITY-MULTITENANCY.md`, `docs/09-CONVENTIONS.md`, `docs/11-MODULES/<M0X>.md`, `docs/12-API-CONTRACTS.md`, `.agent/prompts/new-endpoint.md` |
| Cambio en modelo de datos | `AGENTS.md`, `docs/04-DATA-MODEL.md`, `docs/05-SECURITY-MULTITENANCY.md`, `docs/16-ADR.md`, `docs/09-CONVENTIONS.md` |
| Nueva regla de negocio | `AGENTS.md`, `docs/07-BUSINESS-RULES.md`, `docs/11-MODULES/<M0X>.md`, `docs/15-USER-STORIES.md`, `docs/16-ADR.md` |
| Ajuste de UI / estilo | `AGENTS.md`, `docs/06-DESIGN-SYSTEM.md`, `docs/10-I18N.md`, `docs/11-MODULES/<M0X>.md` |
| Fix de bug | `AGENTS.md`, `docs/11-MODULES/<M0X>.md`, `docs/13-TESTING-QA.md`, `.agent/prompts/bug-fix.md` |
| Nuevo test (unit / E2E) | `AGENTS.md`, `docs/13-TESTING-QA.md`, `docs/11-MODULES/<M0X>.md`, `docs/15-USER-STORIES.md` |
| Migración de DB | `AGENTS.md`, `docs/04-DATA-MODEL.md`, `docs/14-DEPLOYMENT-OPS.md`, `docs/09-CONVENTIONS.md` |
| Deploy / CI/CD | `AGENTS.md`, `docs/14-DEPLOYMENT-OPS.md`, `docs/03-TECH-STACK.md` |
| Nueva traducción (i18n) | `AGENTS.md`, `docs/10-I18N.md`, `docs/06-DESIGN-SYSTEM.md` |
| Duda de arquitectura | `AGENTS.md`, `docs/02-ARCHITECTURE.md`, `docs/16-ADR.md` |
| Antes de PR | `AGENTS.md`, `.agent/pr-checklist.md`, `docs/09-CONVENTIONS.md` |
| Revisión de seguridad | `AGENTS.md`, `docs/05-SECURITY-MULTITENANCY.md`, `docs/04-DATA-MODEL.md` |
| Conciliación bancaria | `AGENTS.md`, `docs/11-MODULES/M08-BANK-RECONCILIATION.md`, `docs/07-BUSINESS-RULES.md`, `docs/04-DATA-MODEL.md` |
| Cobranza / pagos | `AGENTS.md`, `docs/11-MODULES/M06-BILLING.md`, `docs/11-MODULES/M07-PAYMENTS.md`, `docs/07-BUSINESS-RULES.md` |
| Personal / nómina | `AGENTS.md`, `docs/11-MODULES/M04-STAFF-PAYROLL.md`, `docs/07-BUSINESS-RULES.md` |
| Reportes | `AGENTS.md`, `docs/11-MODULES/M11-REPORTS.md`, `docs/06-DESIGN-SYSTEM.md`, `docs/10-I18N.md` |
| Notificaciones | `AGENTS.md`, `docs/11-MODULES/M13-NOTIFICATIONS.md`, `docs/03-TECH-STACK.md` |
| Auditoría | `AGENTS.md`, `docs/11-MODULES/M12-AUDIT.md`, `docs/05-SECURITY-MULTITENANCY.md` |

---

## 🧭 Cómo identificar el tipo de tarea

1. **¿Qué me pide el usuario?** Léelo literalmente.
2. **¿A qué módulo pertenece?** Busca en `docs/11-MODULES/`.
3. **¿Es creación, modificación o fix?** Eso determina los prompts a usar.
4. **¿Toca más de un módulo?** Carga todos los módulos involucrados.

---

## 🚫 Errores comunes a evitar

- **No cargues `docs/15-USER-STORIES.md`** si la tarea no es de implementación de una US.
- **No cargues `docs/16-ADR.md`** si solo vas a escribir un test.
- **No cargues `docs/14-DEPLOYMENT-OPS.md`** si solo vas a modificar un componente React.
- **No cargues todos los módulos.** Solo el afectado.

---

## 🧩 Regla de oro

> Si dudas entre leer 2 o 5 archivos, **lee 3**.
> Si dudas entre leer 5 o 15, **pregunta primero qué alcance tiene la tarea**.

---

## 📌 Cómo se mantiene este archivo

- Cuando se agrega un nuevo módulo en `docs/11-MODULES/`, se agrega una fila aquí.
- Cuando se agrega una nueva carpeta funcional, se agrega una fila.
- Si una tarea nueva no encaja en ninguna fila, se agrega una.