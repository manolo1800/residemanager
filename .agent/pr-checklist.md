
---

## 🗂️ `.agent/pr-checklist.md`

```markdown
---
id: AGENT-PR-CHECKLIST
title: Checklist obligatorio antes de entregar
version: 1.0
audience: agent
used_by_agent_when: "antes de finalizar cualquier tarea o abrir PR"
---

# `.agent/pr-checklist.md`

> **Corre esto mentalmente antes de cada entrega.**
> Si algo falla, no está listo. No lo entregues.

---

## 🧱 1. Arquitectura y aislamiento

- [ ] El código vive en el módulo correcto (`docs/11-MODULES/`).
- [ ] No hay imports cruzados entre módulos (solo facade o eventos).
- [ ] El facade público no expone entidades internas.
- [ ] Si agregué un evento, está versionado (`module.event.v1`).
- [ ] Si toqué varios módulos, la comunicación es por facade o evento.

---

## 🔐 2. Multi-tenancy y seguridad

- [ ] Toda query filtra por `tenant_id`.
- [ ] Si aplica, filtra por `condominium_id`.
- [ ] Las tablas nuevas tienen `tenant_id`.
- [ ] RLS aplicado en tablas nuevas (si aplica).
- [ ] Endpoints tienen `@RequirePermission(...)`.
- [ ] No se acepta `tenant_id` del cliente sin validar contra sesión.
- [ ] No hay fuga de datos entre tenants.
- [ ] No hay datos sensibles en logs.

---

## 🧾 3. Soft delete y auditoría

- [ ] No hay `DELETE` físico.
- [ ] Las queries filtran `deleted_at IS NULL` (salvo históricos explícitos).
- [ ] Toda mutación relevante pasa por `AuditService`.
- [ ] Los cambios de estado se auditan (aprobaciones, rechazos, cancelaciones).

---

## 🗄️ 4. Modelo de datos

- [ ] Si cambié tablas → actualicé `docs/04-DATA-MODEL.md`.
- [ ] Si agregué migración → está probada en local.
- [ ] Los índices necesarios existen (tenant, condominio, soft delete).
- [ ] Los enums están correctos y documentados.
- [ ] Los montos usan `numeric`, no `float`.
- [ ] Las fechas usan `timestamptz`.

---

## 🌐 5. i18n

- [ ] Cero strings hardcodeados.
- [ ] Claves agregadas en los 4 locales (`es/en/fr/pt`).
- [ ] Formatos de fecha/moneda usan el locale del usuario.
- [ ] Timezone se resuelve por condominio.

---

## ✅ 6. Validación y errores

- [ ] Input validado con Zod en el borde.
- [ ] Errores con formato `{ code, message, details }`.
- [ ] Códigos de error únicos y documentados.
- [ ] Idempotencia aplicada en endpoints que mutan pagos/aprobaciones.
- [ ] Rate limiting si aplica.

---

## 🧪 7. Tests

- [ ] Tests unitarios para lógica de dominio nueva.
- [ ] Tests de integración para endpoints nuevos.
- [ ] Test E2E si es un flujo crítico de usuario.
- [ ] Test de aislamiento multi-tenant si toca datos sensibles.
- [ ] Cobertura cumple el mínimo del módulo.
- [ ] Todos los tests pasan localmente.

---

## 🎨 8. Frontend (si aplica)

- [ ] Componentes usan tokens de `docs/06-DESIGN-SYSTEM.md`.
- [ ] Colores del condominio respetados (CSS variables).
- [ ] Estados visuales correctos (incluye `approved_pending_data` en amarillo).
- [ ] Accesibilidad mínima (aria, focus, contraste).
- [ ] Responsive en los breakpoints definidos.
- [ ] No hay `console.log` residual.

---

## 📚 9. Documentación

- [ ] Actualicé `docs/11-MODULES/M0X-*.md` si cambié comportamiento.
- [ ] Actualicé `docs/04-DATA-MODEL.md` si toqué DB.
- [ ] Agregué ADR si tomé una decisión arquitectónica.
- [ ] Actualicé `docs/12-API-CONTRACTS.md` si agregué endpoints.
- [ ] Actualicé `docs/15-USER-STORIES.md` si implementé una US.
- [ ] Actualicé `docs/16-ADR.md` si apliqué una decisión.

---

## 🔍 10. Revisión final

- [ ] El código se lee como si lo hubiera escrito un humano del equipo.
- [ ] No hay TODOs sin contexto.
- [ ] No hay código comentado muerto.
- [ ] Los nombres son claros.
- [ ] No hay duplicación evitable.
- [ ] No hay `any` sin justificación.
- [ ] No hay dependencias nuevas fuera del stack.

---

## 📝 11. Commits y PR

- [ ] Commits siguen Conventional Commits.
- [ ] Un commit por cambio lógico.
- [ ] El PR describe: qué, por qué, cómo probar.
- [ ] El PR referencia el issue/US correspondiente.
- [ ] El PR incluye screenshots si hay UI.

---

## 🚨 12. Bloqueantes duros

Si alguna de estas es "no", **no entregues**:

- ¿Hay query sin `tenant_id`?
- ¿Hay `DELETE` físico?
- ¿Hay import cruzado entre módulos?
- ¿Hay string hardcodeado en UI?
- ¿Hay dependencia nueva sin aprobar?
- ¿Hay lógica de `17-FUTURE-SCOPE.md` implementada?
- ¿Faltan tests en código de dominio nuevo?
- ¿No actualicé la doc correspondiente?

---

## 🧠 Regla final

> **Entregar no es terminar de escribir código.**
> **Entregar es que el repo quede mejor que antes.**