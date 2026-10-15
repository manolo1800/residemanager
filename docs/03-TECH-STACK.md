
---

## 🗂️ `docs/03-TECH-STACK.md`

```markdown
---
id: 03-TECH-STACK
title: Stack tecnológico cerrado
version: 1.0
audience: human+agent
last_updated: 2026-10-12
---

# 03 — Stack Tecnológico

> **Regla:** este stack está **cerrado**. Agregar una dependencia requiere justificación explícita y aprobación.

---

## 🧰 Base

| Área | Tecnología | Versión | Notas |
|---|---|---|---|
| Runtime | Node.js | 22 LTS | `--experimental-strip-types` no usado |
| Package manager | pnpm | 9.x | Workspaces |
| Monorepo | Turborepo | 2.x | Cache remoto opcional |
| Lenguaje | TypeScript | 5.6+ | `strict: true` obligatorio |

---

## 🖥️ Backend

| Área | Tecnología | Notas |
|---|---|---|
| Framework | NestJS 10 | Estructura modular |
| HTTP | Fastify | Adapter por performance |
| ORM | Drizzle ORM | Tipado fuerte, migraciones SQL |
| Validación | Zod | DTOs y validación de borde |
| Autenticación | @nestjs/jwt + argon2 | Access + refresh |
| Documentación API | Scalar | OpenAPI auto-generado |
| Colas | BullMQ | Redis-backed |
| Cache | ioredis | Cliente Redis |
| Logs | Pino | JSON estructurado |
| i18n | nestjs-i18n | Backend |
| PDFs | Puppeteer | Render de recibos y reportes |
| Excel | ExcelJS | Exportación |
| MinIO |
| Push | firebase-admin | FCM |
| WhatsApp | @whiskeysockets/baileys | No oficial |
| Fechas | Luxon | Timezone-safe |

---

## 🎨 Frontend

| Área | Tecnología | Notas |
|---|---|---|
| Framework | Next.js 15 | App Router |
| UI | React 19 | Server Components por defecto |
| Estilos | Tailwind CSS 4 | Design tokens |
| Componentes | shadcn/ui | Customizables |
| Estado servidor | @tanstack/react-query | Queries y mutations |
| Estado global | Zustand | Solo UI state |
| Formularios | react-hook-form + zod | Validación compartida con backend |
| i18n | next-intl | App Router |
| Fechas | Luxon | Timezone-safe |
| Íconos | lucide-react | Set único |

---

## 🗄️ Base de datos e infraestructura

| Área | Tecnología | Notas |
|---|---|---|
| DB | PostgreSQL 16 | RLS activo |
| Pooler | PgBouncer | En producción |
| Cache / colas | Redis 7 | BullMQ + sesiones |
| Storage | MinIO self-hosted | API S3-compatible, `forcePathStyle: true` |
| Contenedores | Docker | Base de todo |
| Deployment | **Dokploy** | Self-hosted sobre Docker |
| Reverse proxy | Traefik | Gestionado por Dokploy |
| SSL | Let's Encrypt | Automático vía Traefik |
| Orquestación | Docker Swarm | Gestionado por Dokploy |
| CI/CD | GitHub Actions + Dokploy webhooks | Calidad en CI, deploy en Dokploy |
| CDN | Cloudflare (opcional) | Assets estáticos |

---

## 🧪 Testing

| Área | Tecnología |
|---|---|
| Unit | Vitest |
| Integration | Vitest + Testcontainers |
| HTTP | Supertest |
| E2E | Playwright |
| Load | k6 |
| Cobertura | V8 + c8 |

---

## 🔧 Herramientas de desarrollo

| Área | Herramienta |
|---|---|
| Lint | ESLint 9 (flat config) |
| Formato | Prettier 3 |
| Git hooks | Husky + lint-staged |
| Commits | commitlint + commitizen |
| Versionado | Changesets |
| CI/CD | GitHub Actions + Dokploy |
| Dependencias | Renovate |
| Editor config | .editorconfig |

---

## 📦 Dependencias permitidas (lista cerrada)

### Backend
@nestjs/common, @nestjs/core, @nestjs/platform-fastify
@nestjs/config, @nestjs/jwt, @nestjs/passport
@nestjs/bullmq, @nestjs/event-emitter, @nestjs/schedule
@nestjs/swagger (solo como metadata para Scalar)
drizzle-orm, drizzle-kit, postgres
zod
argon2
ioredis, bullmq
pino, pino-http
nestjs-i18n
puppeteer, exceljs
minio
firebase-admin
@whiskeysockets/baileys
luxon
helmet, @fastify/cors, @fastify/rate-limit


### Frontend
next, react, react-dom
tailwindcss
@tanstack/react-query
zustand
react-hook-form, @hookform/resolvers, zod
next-intl
lucide-react
recharts
shadcn/ui (componentes copiados)
luxon


### Compartidas
zod
luxon
typescript


---

## 🚫 Dependencias prohibidas

| Librería | Motivo |
|---|---|
| `moment` | Reemplazado por Luxon |
| `axios` | Usar `fetch` nativo |
| `lodash` | Usar utilidades nativas o `es-toolkit` si es indispensable |
| `class-validator` | Zod cumple el rol |
| `typeorm`, `prisma` | Drizzle es el ORM elegido |
| `express` | Fastify es el adapter |
| `swagger-ui` | Scalar lo reemplaza |
| Cualquier ORM/UI kit no listado | Requiere ADR |

---

## 🔐 Variables de entorno requeridas

```env
# App
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000
API_URL=http://localhost:3001

# DB
DATABASE_URL=postgres://user:pass@localhost:5432/sgc

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d

# MinIO
MINIO_ROOT_USER=sgc-admin
MINIO_ROOT_PASSWORD=super-secret-password
S3_ENDPOINT=http://localhost:9000
S3_PUBLIC_ENDPOINT=https://files.tu-dominio.com   # para URLs descargables
S3_REGION=us-east-1
S3_BUCKET=sgc
S3_ACCESS_KEY=sgc-admin
S3_SECRET_KEY=super-secret-password
S3_FORCE_PATH_STYLE=true
S3_USE_SSL=false

# Firebase
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...

# WhatsApp (Baileys)
WHATSAPP_SESSION_PATH=./.baileys

🌐 Puertos locales
Servicio	Puerto
Web	3000
API	3001
PostgreSQL	5432
Redis	6379
MinIO	9000 / 9001
Mailhog (opcional)	8025

📌 Reglas de actualización

Versiones mayores requieren ADR.
Parches de seguridad se aplican sin ADR.
Renovate abre PRs automáticos; requieren revisión humana.
Nunca actualizar más de un major por PR.
Tests deben pasar antes de mergear.

