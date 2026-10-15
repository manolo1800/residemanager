---
id: 14-DEPLOYMENT-OPS
title: Deployment y operaciones con Dokploy + Docker
version: 2.0
audience: human+agent
last_updated: 2026-10-12
---

# 14 — Deployment y Operaciones

> **Plataforma de despliegue:** Dokploy (self-hosted) sobre Docker.
> **Reverse proxy y SSL:** Traefik (gestionado por Dokploy).
> **CI/CD:** GitHub Actions para calidad + webhooks de Dokploy para deploy.

---

## 🌍 Entornos

| Entorno | URL ejemplo | Propósito | Plataforma |
|---|---|---|---|
| `local` | http://localhost:3000 | Desarrollo individual | Docker Compose |
| `dev` | https://dev.sgc.app | Integración temprana | Dokploy (server dev) |
| `staging` | https://staging.sgc.app | Pre-producción | Dokploy (server staging) |
| `prod` | https://app.sgc.app | Producción | Dokploy (server prod) |

Cada entorno tiene su propio proyecto en Dokploy con:
- Sus propias apps (api, web).
- Sus propias bases de datos (postgres, redis).
- Su propio MinIO (como app Docker Compose).
- Su propio dominio + certificado SSL.

---

## 🧭 Arquitectura en Dokploy
┌──────────────────────────────────────┐
│ Dokploy Server │
│ (Docker Swarm + Traefik + UI) │
└──────────────────┬───────────────────┘
│
┌───────────────────────────────┼──────────────────────────────┐
│ │ │
▼ ▼ ▼
┌───────────┐ ┌───────────┐ ┌───────────┐
│ sgc-web │ │ sgc-api │ │ sgc-minio │
│ (Next.js) │ ──────────────► │ (NestJS) │ ──────────────► │ (Docker │
│ │ │ │ │ Compose) │
└───────────┘ └─────┬─────┘ └───────────┘
│
┌──────────────┴──────────────┐
▼ ▼
┌─────────────┐ ┌─────────────┐
│ sgc-postgres│ │ sgc-redis │
│ (managed) │ │ (managed) │
└─────────────┘ └─────────────┘


**Decisiones:**
- `postgres` y `redis`: **databases nativas de Dokploy** (con backups y métricas).
- `minio`: **app tipo Docker Compose** (no es una DB nativa de Dokploy).
- `api` y `web`: **aplicaciones** desplegadas vía Dockerfile.
- Traefik enruta y gestiona SSL por dominio.

---

## 🗂️ Estructura del proyecto en Dokploy
Project: sgc-prod
├── Application: sgc-web
│ ├── Source: GitHub repo (main branch)
│ ├── Build: Dockerfile (./dokploy/web.Dockerfile)
│ ├── Domain: app.sgc.app
│ ├── Env: (variables del web)
│ └── Healthcheck: GET /api/health
│
├── Application: sgc-api
│ ├── Source: GitHub repo (main branch)
│ ├── Build: Dockerfile (./dokploy/api.Dockerfile)
│ ├── Domain: api.sgc.app
│ ├── Env: (variables del api)
│ ├── Healthcheck: GET /api/v1/health
│ └── Volumes: (ninguno — todo en MinIO)
│
├── Database: sgc-postgres (managed)
│ ├── Version: 16
│ ├── Volume: persistente
│ └── Backups: diario 03:00 UTC, retención 30 días
│
├── Database: sgc-redis (managed)
│ ├── Version: 7
│ ├── Volume: persistente
│ └── Sin backups (cache)
│
└── Compose: sgc-minio
├── Source: ./dokploy/minio.compose.yml
├── Domain: files.sgc.app (opcional, para presigned)
├── Volume: persistente
└── Backups: script semanal con mc mirror


---

## 🐳 Dockerfiles

### `dokploy/api.Dockerfile`

```dockerfile
# syntax=docker/dockerfile:1.7

# --- Etapa base ---
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# --- Dependencias ---
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/contracts/package.json packages/contracts/
COPY packages/database/package.json packages/database/
COPY packages/config/package.json packages/config/
COPY packages/i18n/package.json packages/i18n/
COPY packages/storage/package.json packages/storage/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prod=false

# --- Build ---
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .
RUN pnpm --filter api build

# --- Runtime ---
FROM node:22-alpine AS runner
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

ENV NODE_ENV=production

# Copiar solo lo necesario
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/

USER node
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://localhost:3001/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "apps/api/dist/main.js"]

dokploy/web.Dockerfile
# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/
COPY packages/ui/package.json packages/ui/
COPY packages/contracts/package.json packages/contracts/
COPY packages/config/package.json packages/config/
COPY packages/i18n/package.json packages/i18n/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prod=false

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm --filter web build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

USER node
EXPOSE 3000

CMD ["node", "apps/web/server.js"]

Nota: el web.Dockerfile asume output: 'standalone' en next.config.js.

dokploy/minio.compose.yml
# Este compose se despliega en Dokploy como "Docker Compose Application".
# Dokploy le asigna dominio + SSL automáticamente si se configura.

services:
  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    restart: unless-stopped
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    volumes:
      - minio_data:/data
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
      interval: 30s
      timeout: 5s
      retries: 3

  minio-init:
    image: minio/mc:latest
    depends_on:
      minio:
        condition: service_healthy
    restart: "no"
    entrypoint: >
      /bin/sh -c "
      mc alias set local http://minio:9000 $${MINIO_ROOT_USER} $${MINIO_ROOT_PASSWORD} &&
      mc mb --ignore-existing local/sgc-prod &&
      mc anonymous set none local/sgc-prod &&
      echo 'MinIO init OK';
      "

volumes:
  minio_data:


🔧 Variables de entorno
Dokploy gestiona variables por aplicación desde su UI (o vía dokploy CLI). No se versionan.

API (sgc-api)
NODE_ENV=production
PORT=3001
APP_URL=https://app.sgc.app
API_URL=https://api.sgc.app

DATABASE_URL=postgres://sgc:<pass>@sgc-postgres:5432/sgc
REDIS_URL=redis://sgc-redis:6379

JWT_ACCESS_SECRET=<generado>
JWT_REFRESH_SECRET=<generado>
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d

S3_ENDPOINT=http://sgc-minio:9000
S3_PUBLIC_ENDPOINT=https://files.sgc.app
S3_REGION=us-east-1
S3_BUCKET=sgc-prod
S3_ACCESS_KEY=<minio-user>
S3_SECRET_KEY=<minio-pass>
S3_FORCE_PATH_STYLE=true
S3_USE_SSL=false

FIREBASE_PROJECT_ID=<>
FIREBASE_CLIENT_EMAIL=<>
FIREBASE_PRIVATE_KEY=<>

WHATSAPP_SESSION_PATH=/data/baileys

DEFAULT_LOCALE=es
DEFAULT_TIMEZONE=America/Caracas

Web (sgc-web)
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.sgc.app
NEXT_PUBLIC_APP_URL=https://app.sgc.app

Regla: los secretos se crean en Dokploy UI, nunca se commitean.

🚀 Flujo de deployment
Desarrollo local

# Levantar stack completo
docker compose -f docker-compose.yml up -d

# Correr migraciones
pnpm db:migrate

# Levantar apps en watch
pnpm dev

# Deploy a dev / staging / prod vía Dokploy

## Opción A — Automático (recomendado):

1. Merge a develop → webhook de GitHub notifica a Dokploy.
2. Dokploy construye la imagen desde el Dockerfile.
3. Deploy sin downtime con rolling update.
4. Healthcheck determina éxito o rollback.

## Opción B — Manual desde UI:

1. Dokploy UI → proyecto → aplicación → "Deploy".

## Opción C — CLI:
dokploy deploy --project sgc-prod --app sgc-api

Orden de deploy
1. Migraciones (job previo al deploy de api)
2. sgc-api
3. sgc-web
4. Invalidar CDN (si aplica)

Regla: las migraciones deben ser compatibles hacia atrás durante el deploy (nunca eliminar columnas en el mismo release que las dejan de usar).

Rollback
Dokploy guarda historial de deployments. Rollback = seleccionar deployment previo y redeployar.

Migraciones destructivas: requieren plan de rollback manual documentado.

💾 Bases de datos en Dokploy
PostgreSQL
Crear como Database en Dokploy.

Nombre: sgc-postgres.

Volumen persistente.

Backups: diarios con retención 30 días (UI de Dokploy).

Conectar a la API vía DATABASE_URL.

Migraciones: se ejecutan como job antes del deploy o desde un contenedor efímero.

Comando de migración en deploy:

# En el CMD del Dockerfile o en un step de CI:
node apps/api/dist/scripts/migrate.js

O se puede correr como tarea desde Dokploy UI.

Redis
Crear como Database en Dokploy.

Nombre: sgc-redis.

Volumen persistente (opcional si se usa solo como cache; obligatorio si se usa para BullMQ).

Sin backups (es cache/cola).

🗄️ Almacenamiento (MinIO)
Despliegue
MinIO se despliega como Docker Compose Application en Dokploy (no es una DB nativa).

Domain: files.sgc.app (opcional, solo si se usan presigned URLs).

Volumen: minio_data persistente.

Acceso
Nunca buckets públicos.

Nunca URLs directas al endpoint interno.

Todo acceso por:

Proxy API (/api/v1/files/:id/download) para archivos sensibles.

Presigned URL con expiración 15 min para descargas puntuales.

Backups
Script programado (cron en el host o job de Dokploy):

#!/usr/bin/env bash
mc alias set local http://localhost:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"
mc alias set backup https://backup.example.com "$BACKUP_USER" "$BACKUP_PASSWORD"
mc mirror --overwrite --remove local/sgc-prod backup/sgc-prod


Frecuencia:

Diario: incremental.
Semanal: completo a almacenamiento frío.
Retención: 30 días diario, 1 año semanal, 5 años mensual.

🔐 SSL y dominios
Dokploy usa Traefik con Let's Encrypt automático.

Por cada app se configura:

Dominio (ej: api.sgc.app).

Puerto interno (3001, 3000).

SSL (Let's Encrypt automático).

Redirect HTTP → HTTPS (activado).

Reglas:

Un dominio por app.

Nunca exponer puertos directamente al host.

Traefik enruta por host header.

📊 Observabilidad
Logs
Dokploy captura logs de containers.

Visibles desde UI o vía docker service logs.

Formato JSON estructurado (Pino) desde la API.

Retención: 30 días (o según plan del host).

Métricas
Dokploy muestra CPU/RAM/disco por app y DB.

Para métricas avanzadas: Prometheus + Grafana como servicios adicionales.

Trazas
OpenTelemetry exportado a un collector (opcional en v1).

Sampling 10% en prod.

Alertas
Configurables desde Dokploy o vía servicios externos:

Alerta	Umbral	Acción
API p95 > 500 ms	5 min	Notificar admin
Error rate > 2%	5 min	Notificar admin
CPU > 80%	10 min	Notificar + escalar
Disco > 80%	30 min	Notificar
Healthcheck fallido	Inmediato	Rollback automático
Backup fallido	Inmediato	Notificar
🔄 Backups y restauración
PostgreSQL
Backup automático en Dokploy (por DB).

Frecuencia: diaria.

Retención: 30 días.

Restauración: desde UI de Dokploy o pg_restore manual.

MinIO
Script propio (ver arriba).

Restauración: mc mirror backup/sgc-prod local/sgc-prod.

Redis
Sin backup (es cache/cola).

Si se requiere persistencia de colas: habilitar RDB + backup.

Plan de restauración (DR)
Nuevo servidor con Dokploy.

Restaurar PostgreSQL desde backup.

Restaurar MinIO desde backup.

Redeploy de apps con mismo dominio.

RTO objetivo: 4 horas. RPO: 24 horas.

🔐 Secretos
Gestionados en Dokploy UI por aplicación.

Nunca en .env versionado.

Nunca en logs.

Rotación cada 90 días.

Rotación inmediata si hay sospecha de compromiso.

🧯 Runbook
API caída
Dokploy UI → app sgc-api → ver logs.

Verificar healthcheck.

Verificar conexión a PostgreSQL y Redis.

Redeployar si es necesario.

Rollback al deployment previo si persiste.

PostgreSQL lenta
Dokploy UI → DB → métricas.

Revisar conexiones activas.

Identificar query lenta (pg_stat_activity).

Considerar escalar el VPS.

MinIO lleno
Verificar uso de disco del servidor.

Ejecutar backup.

Archivar archivos antiguos.

Expandir volumen del host.

Baileys caído
Verificar contenedor sgc-api.

Revisar logs de Baileys.

Reiniciar app.

Re-escanear QR si es necesario.

Deploy falla
Dokploy muestra logs del build.

Errores comunes: variable faltante, migración rota, tipo TS.

Corregir en repo → push → redeploy automático.

📌 Reglas duras
Nunca deploy directo a prod sin staging.

Nunca migración destructiva sin ADR + rollback plan.

Nunca secretos en repo.

Nunca saltar healthcheck.

Backup antes de migración grande.

Deploy siempre vía Dokploy (nunca docker service update manual).

Traefik gestiona SSL — no configurar certificados a mano.

Un dominio por app — no multi-dominio en v1.

🛠️ Comandos útiles
# Listar servicios en el servidor Dokploy
docker service ls

# Logs de un servicio
docker service logs sgc-prod_sgc-api -f

# Estado de la base de datos
docker exec -it $(docker ps -qf "name=postgres") psql -U sgc -d sgc

# Healthcheck manual
curl -f https://api.sgc.app/api/v1/health

# Forzar redeploy (vía webhook)
curl -X POST https://dokploy.example.com/api/deploy/<webhook-id>

📦 Archivos de infraestructura en el repo
/dokploy
├── README.md                    # instrucciones del deploy
├── api.Dockerfile               # Dockerfile del API
├── web.Dockerfile               # Dockerfile del Web
├── minio.compose.yml            # compose de MinIO para Dokploy
├── migrate.Dockerfile           # job de migraciones (opcional)
└── scripts/
    ├── backup-minio.sh
    └── restore-minio.sh

Estos archivos se versionan. La configuración de Dokploy (env vars, dominios, backups) no se versiona.