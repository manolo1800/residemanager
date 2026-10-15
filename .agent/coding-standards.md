---
id: AGENT-CODING-STANDARDS
title: Estándares de código del proyecto SGC
version: 1.0
audience: agent
used_by_agent_when: "escribiendo o modificando código"
---

# `.agent/coding-standards.md`

> Refleja y detalla `docs/09-CONVENTIONS.md`. Si hay conflicto, gana `docs/09`.

---

## 🧱 Estructura de un módulo (NestJS)
modules/<module-name>/
├── <module-name>.module.ts ← registro público
├── <module-name>.facade.ts ← único punto de entrada para otros módulos
├── application/
│ ├── services/ ← casos de uso
│ └── dto/ ← DTOs con Zod
├── domain/
│ ├── entities/ ← entidades de dominio
│ ├── value-objects/
│ └── events/ ← eventos que emite
├── infrastructure/
│ ├── repositories/ ← implementación Drizzle
│ ├── persistence/ ← schema, migraciones
│ └── external/ ← MinIO, FCM, Baileys, etc.
└── presentation/
├── controllers/ ← HTTP
└── guards/ ← permisos por endpoint


Regla: **nada fuera de `facade.ts` es público para otros módulos.**

---

## 🏷️ Naming

| Elemento | Convención | Ejemplo |
|---|---|---|
| Archivos | `kebab-case` | `payment-receipt.service.ts` |
| Clases | `PascalCase` | `PaymentReceiptService` |
| Interfaces | `PascalCase` sin prefijo `I` | `PaymentRepository` |
| Funciones / métodos | `camelCase` | `calculateTax()` |
| Variables | `camelCase` | `baseCurrency` |
| Constantes | `UPPER_SNAKE` | `MAX_PAYLOAD_SIZE` |
| Tablas DB | `snake_case` plural | `payment_receipts` |
| Columnas | `snake_case` | `reference_number` |
| Enums DB | `snake_case` | `payment_status` |
| DTOs | sufijo `Dto` | `CreatePaymentDto` |
| Endpoints | `kebab-case` plural | `/api/v1/payment-receipts` |

---

## 🧬 Capas y responsabilidades

- **Controller:** valida input (Zod), delega al service, formatea output. Sin lógica de negocio.
- **Service (application):** orquesta casos de uso. Sin acceso directo a DB.
- **Domain:** reglas puras. Testeable sin infraestructura.
- **Repository:** única capa con acceso a DB.
- **Facade:** expone funcionalidad del módulo a otros módulos.

---

## ✅ Validación

- **Zod en el borde** (controller). Nada de `class-validator` suelto.
- Errores unificados con formato `{ code, message, details }`.
- Todo input externo pasa por Zod. Nunca confíes en el cliente.

---

## 🗄️ Base de datos (Drizzle)

- Todas las tablas de dominio tienen: `id`, `tenant_id`, `created_at`, `updated_at`, `deleted_at`, `created_by`, `updated_by`.
- Tablas dependientes de un condominio incluyen además `condominium_id`.
- **Toda query filtra `deleted_at IS NULL`** salvo que explícitamente quieras históricos.
- **Toda query filtra `tenant_id`** y `condominium_id` si aplica.
- Usa transacciones para operaciones multi-tabla.
- Nunca escribas SQL crudo sin justificación. Si lo haces, documéntalo.

---

## 🔐 Seguridad por defecto

- Los endpoints llevan `@RequirePermission('module:action')`.
- Los guards verifican: usuario autenticado + tenant + condominio + permiso.
- Nunca exponer entidades de dominio directamente. Usa DTOs de salida.
- Los IDs internos no se traducen a nombres en DB; se usan UUID.

---

## 🌐 i18n

- **Cero strings hardcodeados** en backend ni frontend.
- Backend: `nestjs-i18n` con claves tipo `payments.errors.duplicate_reference`.
- Frontend: `next-intl` con namespace por módulo.
- Locales obligatorios: `es`, `en`, `fr`, `pt`.
- Fechas en UTC en BD, render según timezone del condominio.

---

## 💰 Manejo de dinero y monedas

- Nunca uses `float` para dinero. Usa `numeric(14,2)` en DB y `Decimal` en código.
- Todo monto guarda: `amount`, `currency`, `exchange_rate` (opcional), `amount_base_currency`.
- Conversión se hace **al momento de aceptar el pago**, no después.
- La moneda base la define el condominio.

---

## 📅 Fechas y tiempo

- Almacenamiento: `timestamptz` en UTC.
- Render: según timezone del condominio (`docs/10-I18N.md`).
- Formato interno 24h. Formato de visualización configurable por condominio.
- Nunca uses `new Date()` sin contexto. Usa el `ClockService` del proyecto.

---

## 🧪 Tests

- **Unit:** dominio puro (sin DB).
- **Integration:** service + repository real (Testcontainers).
- **E2E:** Playwright para flujos críticos.
- **Performance:** k6 en endpoints de pago y conciliación.
- Cobertura mínima: 80% en módulos de dominio, 60% en infraestructura.

---

## 📢 Eventos entre módulos

- Los módulos se comunican por **eventos** (EventEmitter interno o BullMQ) o por **facade**.
- Nunca importes servicios de otro módulo directamente.
- Los eventos son inmutables y versionados (`payment.approved.v1`).

---

## 🧼 Commits

Conventional Commits:
    - feat(payments): add admin manual payment registration
    - fix(billing): correct tax calculation for exempt condominiums
    - docs(architecture): add ADR-009 on Baileys usage
    - refactor(audit): extract audit interceptor
    - test(reconciliation): add Banesco parser edge cases


---

## 🎨 Frontend (Next.js)

- App Router. Server components por defecto. Client components solo cuando es necesario.
- Estado del servidor: React Query.
- Estado global de UI: Zustand (ej: `activeCondominiumId`).
- Estilos: Tailwind + tokens del design system (`docs/06-DESIGN-SYSTEM.md`).
- Componentes reutilizables en `packages/ui`.
- Colores del condominio vía CSS variables + ThemeProvider.

---

## 🚫 Anti-patrones prohibidos

- Lógica de negocio en controllers.
- Acceso directo a DB desde controllers.
- Imports cruzados entre módulos.
- `any` sin justificación.
- `console.log` en producción.
- Strings hardcodeados.
- Fechas sin timezone.
- Montos sin moneda.
- Queries sin filtro de tenant.
- DELETE físico.