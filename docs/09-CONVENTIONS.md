---
id: 09-CONVENTIONS
title: Convenciones de código y trabajo
version: 1.0
audience: human+agent
last_updated: 2026-10-12
---

# 09 — Convenciones

> Este documento es la **ley del repo**. `.agent/coding-standards.md` lo refleja y detalla para el agente.

---

## 🏷️ Naming

### Archivos y carpetas
- `kebab-case` para archivos y directorios.
- Ejemplos: `payment-receipt.service.ts`, `bank-reconciliation/`.

### Código
| Elemento | Convención | Ejemplo |
|---|---|---|
| Clases | `PascalCase` | `PaymentService` |
| Interfaces | `PascalCase` sin `I` | `PaymentRepository` |
| Tipos | `PascalCase` | `PaymentStatus` |
| Enums | `PascalCase` (nombre), `UPPER_SNAKE` (valores) | `PaymentStatus.APPROVED` |
| Funciones / métodos | `camelCase` | `calculateTax()` |
| Variables | `camelCase` | `baseCurrency` |
| Constantes | `UPPER_SNAKE` | `MAX_PAYLOAD_SIZE` |
| DTOs | sufijo `Dto` | `CreatePaymentDto` |
| Servicios | sufijo `Service` | `PaymentsService` |
| Controladores | sufijo `Controller` | `PaymentsController` |
| Repositorios | sufijo `Repository` | `PaymentsRepository` |
| Facades | sufijo `Facade` | `PaymentsFacade` |
| Guards | sufijo `Guard` | `PermissionGuard` |
| Interceptores | sufijo `Interceptor` | `AuditInterceptor` |
| Eventos | `module.event.vN` | `payment.approved.v1` |

### Base de datos
| Elemento | Convención | Ejemplo |
|---|---|---|
| Tablas | `snake_case` plural | `payment_receipts` |
| Columnas | `snake_case` | `reference_number` |
| Enums | `snake_case` | `payment_status` |
| Índices | `idx_<tabla>_<cols>` | `idx_payments_status_condo` |
| Constraints | `fk_`, `uk_`, `ck_` | `fk_payments_unit_id` |
| Migraciones | `YYYYMMDDHHMMSS_description` | `20261012143000_add_payment_origin` |

---

## 📂 Estructura de módulo
modules/<module-name>/
├── <module-name>.module.ts
├── <module-name>.facade.ts
├── application/
│ ├── services/
│ └── dto/
├── domain/
│ ├── entities/
│ ├── value-objects/
│ ├── rules/
│ └── events/
├── infrastructure/
│ ├── repositories/
│ ├── persistence/
│ └── external/
└── presentation/
├── controllers/
└── guards/


**Regla:** solo `<module-name>.facade.ts` es público para otros módulos.

---

## 🧬 Capas

| Capa | Responsabilidad | Puede importar |
|---|---|---|
| Controller | Validar input, formatear output | Service, DTOs |
| Service | Orquestar casos de uso | Domain, Repository, Facades externos |
| Domain | Reglas puras, entidades | Solo librerías puras |
| Repository | Acceso a datos | Domain (tipos), Drizzle |
| Facade | Exponer funcionalidad | Service |

Nunca:
- Controller con lógica de negocio.
- Service con queries directas.
- Domain con acceso a DB o HTTP.
- Repository con lógica de negocio.

---

## 📦 DTOs y validación

- **Zod** para validación y tipos.
- Un DTO por operación (Create, Update, Query).
- Los DTOs se comparten con el frontend vía `packages/contracts`.
- Nunca exponer entidades de dominio directamente.

Ejemplo:
```ts
export const CreatePaymentDto = z.object({
  unitId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  referenceNumber: z.string().optional(),
  paymentDate: z.string().date(),
});
export type CreatePaymentDto = z.infer<typeof CreatePaymentDto>;

🚨 Manejo de errores
Formato unificado
{
  "code": "PAYMENT_NOT_FOUND",
  "message": "El pago no existe.",
  "details": {}
}

## Códigos de error
- UPPER_SNAKE_CASE.
- Prefijo por módulo: PAYMENT_*, BILLING_*, BANK_*.
- Únicos en todo el sistema.
- Documentados en docs/12-API-CONTRACTS.md.

## Excepciones custom
export class PaymentNotFoundException extends DomainException {
  constructor(id: string) {
    super('PAYMENT_NOT_FOUND', `Payment ${id} not found`, 404);
  }
}

🔐 Seguridad en código
Toda query filtra por tenant_id (y condominium_id si aplica).

Todo endpoint lleva @RequirePermission.

Toda mutación relevante pasa por AuditService.

Nunca loguear PII.

Nunca loguear tokens ni passwords.

Nunca exponer IDs internos si no es necesario.

🌐 i18n en código
Backend: claves module.section.key (ej: payments.errors.duplicate_reference).

Frontend: claves con namespace por módulo.

Todas las claves en los 4 locales.

Nunca concatenar strings de UI.

💰 Manejo de dinero
numeric(14,2) en DB.

Decimal de decimal.js en código.

Nunca float ni number para dinero.

Toda operación con moneda explícita.

Conversión solo al aceptar pagos.

📅 Manejo de fechas
DB: timestamptz en UTC.

Código: Luxon con timezone explícito.

Render: según timezone del condominio.

Formato interno siempre 24h.

Nunca new Date() sin contexto.

🧪 Testing
Unit: dominio puro, sin DB.

Integration: servicios + repositorios reales (Testcontainers).

E2E: Playwright, flujos de usuario.

Load: k6 en endpoints críticos.

Nombres:

text
describe('PaymentsService', () => {
  it('should approve a payment with reference', async () => { ... });
});
Cobertura mínima:

Dominio: 80%.

Servicios: 70%.

Infraestructura: 50%.

📝 Commits
Conventional Commits:

text
<type>(<scope>): <subject>

<body>

<footer>
Types: feat, fix, docs, refactor, test, chore, perf, ci, build, style.

Ejemplos:

text
feat(payments): add admin manual payment registration
fix(billing): correct tax calculation for exempt condominiums
docs(architecture): add ADR-010 on MinIO storage
refactor(audit): extract audit interceptor
test(reconciliation): add Banesco parser edge cases
Breaking changes: BREAKING CHANGE: en footer.

🌿 Ramas
Rama	Uso
main	Producción
develop	Integración
feat/<scope>-<desc>	Features
fix/<scope>-<desc>	Bug fixes
chore/<desc>	Tareas varias
hotfix/<desc>	Fixes urgentes en main
Merge a main solo desde develop o hotfix.

🔀 Pull Requests
Título
Mismo formato que commit.

Descripción
Debe incluir:

Qué: breve descripción.

Por qué: contexto o issue.

Cómo: notas de implementación.

Cómo probar: pasos.

Screenshots: si hay UI.

Checklist: del .agent/pr-checklist.md.

Revisión
Mínimo 1 revisor humano.

El agente puede revisar, pero la aprobación final es humana.

No se mergea con tests rojos.

No se mergea con conflictos.

🗂️ Estructura de carpetas del monorepo
text
/apps
  /api
  /web
/packages
  /ui
  /contracts
  /config
  /database
  /i18n
  /storage
/modules (en apps/api/src)
  /identity
  /tenants
  /condominiums
  /properties
  /residents
  /staff
  /payroll
  /expenses
  /suppliers
  /billing
  /payments
  /bank-reconciliation
  /minutes
  /incidents
  /complaints
  /reports
  /notifications
  /audit
  /settings
🧼 Limpieza de código
Sin console.log en producción.

Sin TODO sin contexto (incluir issue).

Sin código comentado muerto.

Sin imports sin usar.

Sin any sin justificación.

Sin duplicación evitable.

📚 Documentación en código
Comentarios solo cuando aclaran por qué, no qué.

JSDoc en APIs públicas de paquetes compartidos.

Comentarios con ID de regla de negocio cuando aplique:

ts
// BR-012: si no hay comprobante ni referencia → approved_pending_data
🔄 Actualización de documentación
Regla dura: un cambio en código = un cambio en .md correspondiente.

Nuevo endpoint → actualizar docs/11-MODULES/.

Nuevo modelo de datos → docs/04-DATA-MODEL.md.

Nueva regla de negocio → docs/07-BUSINESS-RULES.md.

Nueva decisión arquitectónica → docs/16-ADR.md.

Nuevo componente UI → docs/06-DESIGN-SYSTEM.md.

✅ Checklist del PR
El checklist completo vive en .agent/pr-checklist.md. Resumen mínimo:

□ Tests pasan.
□ Lint pasa.
□ Cobertura cumple mínimo.
□ Sin console.log.
□ Sin any sin justificar.
□ Filtros de tenant aplicados.
□ Auditoría si muta.
□ i18n si hay strings.
□ Documentación actualizada.
🚀 Reglas de release
Versión semántica en package.json.

Tags vX.Y.Z en main.

Changelog generado automáticamente.

Deploy automático a staging en merge a develop.

Deploy a producción solo con tag.

🧠 Regla general
Si una convención no está escrita aquí, no existe.
Propón una nueva vía PR a este documento.
