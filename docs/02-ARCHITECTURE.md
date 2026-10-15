---
id: 02-ARCHITECTURE
title: Arquitectura del sistema
version: 1.0
audience: human+agent
last_updated: 2026-10-12
---

# 02 — Arquitectura

## 🏛️ Estilo arquitectónico

- **Monolito modular** con fronteras estrictas por dominio.
- Cada módulo expone **solo un facade público** (`*.facade.ts`).
- **Prohibido** importar entidades o repositorios de otro módulo.
- Comunicación entre módulos por **facade** o **eventos**.
- Diseñado para **extracción futura a microservicios** sin refactor.

---

## 🗺️ Diagrama de alto nivel
┌─────────────────────────────────────────────────────────────┐
│ Cliente (Next.js) │
│ - App Router │
│ - React Query (server state) │
│ - Zustand (client state: activeCondominiumId) │
│ - Tailwind + design tokens │
└────────────────────────┬────────────────────────────────────┘
│ HTTPS / REST / JWT
▼
┌─────────────────────────────────────────────────────────────┐
│ API (NestJS + Fastify) │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ Middleware: Auth → Tenant → Condo → RBAC → Audit │ │
│ └───────────────────────────────────────────────────────┘ │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ Módulos (monolito modular) │ │
│ │ identity | tenants | condominiums | properties | ... │ │
│ └───────────────────────────────────────────────────────┘ │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ Infraestructura compartida │ │
│ │ Drizzle | Redis | BullMQ | MinIO | FCM | Baileys │ │
│ └───────────────────────────────────────────────────────┘ │
└────────┬──────────────────┬────────────────────┬────────────┘
│ │ │
▼ ▼ ▼
┌──────────┐ ┌─────────────┐ ┌──────────┐
│PostgreSQL│ │ Redis │ │ MinIO │
│ + RLS │ │ + BullMQ │ │(archivos)│
└──────────┘ └─────────────┘ └──────────┘


---

## 📂 Estructura del monorepo
/repo
├── AGENTS.md
├── .agent/
├── docs/
├── apps/
│ ├── api/ # NestJS + Fastify
│ └── web/ # Next.js
├── packages/
│ ├── ui/ # Design system
│ ├── contracts/ # DTOs + Zod schemas compartidos
│ ├── config/ # eslint, tsconfig, tailwind presets
│ ├── database/ # migraciones, seeds, factories
│ └── i18n/ # traducciones compartidas
├── turbo.json
├── pnpm-workspace.yaml
└── docker-compose.yml


---

## 🧩 Estructura interna de un módulo (NestJS)
modules/<module-name>/
├── <module-name>.module.ts # registro en NestJS
├── <module-name>.facade.ts # ÚNICO punto público
├── application/
│ ├── services/ # casos de uso
│ └── dto/ # DTOs (Zod)
├── domain/
│ ├── entities/ # entidades puras
│ ├── value-objects/
│ ├── events/ # eventos que emite
│ └── rules/ # reglas de negocio puras
├── infrastructure/
│ ├── repositories/ # implementación Drizzle
│ ├── persistence/ # schemas y migraciones
│ └── external/ # MinIO, FCM, Baileys, etc.
└── presentation/
├── controllers/ # HTTP
└── guards/ # permisos por endpoint


Reglas de encapsulamiento:
- Solo `<module>.facade.ts` es público para otros módulos.
- Los controladores nunca se importan entre módulos.
- Los servicios de aplicación son privados.
- Las entidades de dominio son privadas.

---

## 🌐 Multi-tenancy SPT (Shared Pool Tenant)

### Modelo
- Una sola base de datos.
- Todas las tablas de dominio llevan `tenant_id`.
- Tablas dependientes de un condominio llevan además `condominium_id`.
- **Doble capa de aislamiento:**
  1. **Capa de aplicación:** repositorios filtran automáticamente por `tenant_id` y `condominium_id` del contexto de request.
  2. **Capa de DB:** RLS activo con `SET LOCAL app.tenant_id` y `app.condominium_id` por transacción.

### Resolución del contexto por request
1. Cliente envía JWT en Authorization.
2. JWT contiene: user_id, tenant_id, active_condominium_id.
3. Middleware NestJS extrae y valida.
4. Se inyecta TenantContext en el request.
5. Repositorios leen el contexto.
6. Se ejecuta SET LOCAL en la transacción antes de queries.
7. RLS aplica el filtro a nivel DB.


### Switch de condominio
- El usuario puede pertenecer a N condominios del mismo tenant.
- El switch **no** cambia el JWT. Envía header `X-Condominium-Id`.
- El backend valida que el usuario tenga acceso a ese condominio.
- Se actualiza `active_condominium_id` en `sessions` y se emite nuevo JWT si es necesario.

---

## 🧱 Reglas de comunicación entre módulos

Permitido:
- Importar el `*.facade.ts` de otro módulo.
- Suscribirse a eventos públicos (`*.event.ts`).
- Consumir DTOs de `packages/contracts`.

Prohibido:
- Importar entidades o repositorios de otro módulo.
- Importar servicios de aplicación de otro módulo.
- Compartir tablas entre módulos sin pasar por el dueño.

Ejemplo correcto:
```ts
// ✅ Permitido
import { PaymentsFacade } from '@modules/payments/payments.facade';

await paymentsFacade.registerAdminPayment({...});

Ejemplo incorrecto:
// ❌ Prohibido
import { PaymentRepository } from '@modules/payments/infrastructure/repositories/payment.repository';


## 🔄 Comunicación asíncrona

- EventEmitter interno (NestJS) para eventos síncronos dentro del mismo proceso.
- BullMQ + Redis para:
  - Notificaciones push y WhatsApp.
  - Procesamiento de archivos bancarios pesados.
  - Generación de PDFs.
  - Reportes exportables.

Reintentos de tareas fallidas.
Los eventos se nombran con versión: payment.approved.v1.

💾 Persistencia y transacciones
ORM: Drizzle. Esquema declarativo en packages/database.

Migraciones versionadas en packages/database/migrations.

Toda operación multi-tabla va en transacción.

Se hace SET LOCAL al inicio de cada transacción para RLS.

Índices compuestos obligatorios: (tenant_id, condominium_id, ...).

🧠 Cache
Redis para:

Sesiones activas.

Configuración del condominio (colores, timezone, monedas).

Catálogos (categorías, métodos de pago).

Rate limiting.

Idempotency keys.

Invalidación explícita al modificar datos cacheados.

📦 Almacenamiento de archivos
S3-compatible (MinIO).

Estructura de buckets:

receipts/ — comprobantes de pago.

contracts/ — contratos de personal.

minutes/ — actas.

incidents/ — adjuntos de incidencias.

branding/ — logos de condominios.

exports/ — reportes generados.

Los archivos se referencian por file_id (tabla files), nunca por URL directa.

🚀 Escalabilidad y performance
Fastify por su throughput superior a Express.

Índices compuestos por tenant y condominio.

Paginación obligatoria en listados.

Colas para tareas pesadas.

Cache de catálogos y configuración.

Connection pooling con PgBouncer.

Réplicas de lectura en fases futuras.

Horizontal scaling de la API detrás de balanceador.

🔍 Observabilidad
Logs estructurados con Pino (JSON).

Trazas con OpenTelemetry.

Métricas exportadas a Prometheus / Grafana (opcional).

Correlation ID por request, propagado a logs y eventos.

🧪 Estrategia de testing por capa
Capa	Tipo	Herramienta
Dominio	Unit	Vitest
Servicios de aplicación	Integration	Vitest + Testcontainers
Endpoints	Integration	Supertest
Flujos de usuario	E2E	Playwright
Performance	Load	k6
🔐 Seguridad (resumen)
Detalle en docs/05-SECURITY-MULTITENANCY.md.

JWT access (15 min) + refresh (7 días).

Argon2id para passwords.

Rate limiting por IP y por usuario.

CORS estricto.

Headers de seguridad (Helmet).

Validación Zod en el borde.

Auditoría de mutaciones.

📌 Criterios para extraer un módulo a microservicio
Un módulo puede extraerse cuando:

Solo depende de otros por facade o eventos.

Tiene su propio esquema de tablas.

No comparte transacciones con otros módulos.

Su carga justifica escalar independientemente.

Su equipo lo mantiene independientemente.

Ninguno de los módulos actuales cumple aún los 5 criterios. Se reevaluará en Fase 12.

