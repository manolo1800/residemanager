
---

## 🗂️ `docs/16-ADR.md`

```markdown
---
id: 16-ADR
title: Architecture Decision Records
version: 1.0
audience: human+agent
last_updated: 2026-10-12
---

# 16 — Architecture Decision Records (ADR)

> Registro de decisiones arquitectónicas. Formato: contexto, decisión, consecuencias, alternativas.

---

## ADR-001 — Monolito modular sobre microservicios

**Estado:** Aceptado
**Fecha:** 2026-10-12

### Contexto
El proyecto debe soportar 10 tenants el primer año con alta concurrencia en días de pago. Un enfoque de microservicios introduce complejidad operativa temprana.

### Decisión
Adoptar un **monolito modular** con fronteras estrictas por dominio. Cada módulo expone solo un facade público. La extracción a microservicio será posible sin refactor.

### Consecuencias
- ✅ Menor complejidad operativa inicial.
- ✅ Deploy único.
- ✅ Transacciones ACID locales.
- ⚠️ Requiere disciplina para no romper el aislamiento.
- ⚠️ Escalado horizontal de toda la API, no por servicio.

### Alternativas
- Microservicios desde día 1: descartado por overhead.
- Monolito tradicional sin fronteras: descartado por deuda técnica.

---

## ADR-002 — PostgreSQL con RLS para aislamiento multi-tenant

**Estado:** Aceptado
**Fecha:** 2026-10-12

### Contexto
SaaS multi-tenant con riesgo de fuga de datos entre tenants.

### Decisión
Modelo Shared Pool Tenant (SPT) con `tenant_id` en todas las tablas y RLS activo. Doble capa: aplicación + base de datos.

### Consecuencias
- ✅ Una sola DB, mantenimiento simple.
- ✅ RLS previene fugas incluso con bugs de aplicación.
- ✅ Costo por tenant bajo.
- ⚠️ Todas las queries deben filtrar (disciplina).
- ⚠️ Backup/restore por tenant más complejo.

### Alternativas
- DB por tenant: descartado por costo operativo.
- Schema por tenant: descartado por complejidad de migraciones.

---

## ADR-003 — Drizzle ORM sobre Prisma

**Estado:** Aceptado
**Fecha:** 2026-10-12

### Contexto
Se necesita un ORM tipado, con soporte para RLS y control fino de queries.

### Decisión
Usar **Drizzle ORM**.

### Consecuencias
- ✅ Tipado fuerte, queries SQL-like.
- ✅ Control fino de queries y `SET LOCAL` para RLS.
- ✅ Migraciones SQL versionadas.
- ⚠️ Menos “mágico” que Prisma, requiere entender SQL.

### Alternativas
- Prisma: descartado por menor control de RLS y queries complejas.
- TypeORM: descartado por mantenimiento irregular.

---

## ADR-004 — NestJS + Fastify

**Estado:** Aceptado
**Fecha:** 2026-10-12

### Contexto
Alta concurrencia en días de pago. Necesitamos throughput alto.

### Decisión
NestJS como framework, Fastify como adapter HTTP.

### Consecuencias
- ✅ 2-3x throughput sobre Express.
- ✅ Estructura modular de NestJS.
- ✅ Ecosistema de plugins Fastify.
- ⚠️ Algunos middlewares de NestJS asumen Express.

### Alternativas
- Express: descartado por performance.
- Fastify puro: descartado por falta de estructura modular.

---

## ADR-005 — Scalar sobre Swagger UI

**Estado:** Aceptado
**Fecha:** 2026-10-12

### Contexto
Se necesita documentación OpenAPI moderna y usable.

### Decisión
Usar **Scalar**.

### Consecuencias
- ✅ UI moderna.
- ✅ Mejor experiencia que Swagger.
- ✅ Compatible con OpenAPI 3.1.
- ⚠️ Menos conocido que Swagger UI.

---

## ADR-006 — Soft delete universal

**Estado:** Aceptado
**Fecha:** 2026-10-12

### Contexto
Requisito de auditoría y conservación de históricos por 5 años.

### Decisión
Nunca `DELETE` físico. Todas las tablas de dominio tienen `deleted_at`.

### Consecuencias
- ✅ Histórico preservado.
- ✅ Auditoría completa.
- ⚠️ Todas las queries deben filtrar `deleted_at IS NULL`.
- ⚠️ Crecimiento de tablas → particionado futuro.

---

## ADR-007 — Estado `approved_pending_data` en pagos

**Estado:** Aceptado
**Fecha:** 2026-10-12

### Contexto
El admin puede registrar pagos sin comprobante ni referencia. No debe bloquear el estado de cuenta pero debe quedar trazable.

### Decisión
Nuevo estado `approved_pending_data` con impacto contable idéntico a `approved`.

### Consecuencias
- ✅ Flexibilidad operativa.
- ✅ Trazabilidad de la deuda documental.
- ✅ Panel dedicado y notificaciones.
- ⚠️ Requiere UI específica y reportes.

---

## ADR-008 — Turborepo + pnpm

**Estado:** Aceptado
**Fecha:** 2026-10-12

### Contexto
Monorepo con apps y packages compartidos.

### Decisión
Turborepo para orquestación + pnpm workspaces.

### Consecuencias
- ✅ Cache de builds.
- ✅ Ejecución en paralelo.
- ✅ Fácil agregar apps.
- ⚠️ Curva de aprendizaje.

### Alternativas
- Nx: descartado por complejidad.
- Yarn workspaces: descartado por menor performance.

---

## ADR-009 — i18n con next-intl + nestjs-i18n

**Estado:** Aceptado
**Fecha:** 2026-10-12

### Contexto
Soporte de 4 idiomas en backend y frontend.

### Decisión
next-intl en web, nestjs-i18n en API. Claves compartidas en `packages/i18n`.

### Consecuencias
- ✅ Traducciones centralizadas.
- ✅ Coherencia entre capas.
- ⚠️ Sincronización de claves obligatoria (CI check).

---

## ADR-010 — Almacenamiento con MinIO self-hosted

**Estado:** Aceptado
**Fecha:** 2026-10-12

### Contexto
El proyecto requiere almacenar comprobantes, contratos, actas, logos y reportes. Originalmente se planteó S3-compatible con opción a AWS S3.

### Decisión
Usar **MinIO self-hosted** como único backend de almacenamiento. El código usa `@aws-sdk/client-s3` con `forcePathStyle: true`. No se usará AWS S3 ni Backblaze en producción.

### Consecuencias
- ✅ Cero costo de almacenamiento en nube.
- ✅ Control total de datos (útil para regulaciones locales).
- ✅ Portabilidad si se migra después.
- ✅ API S3-compatible (sin cambios de código).
- ⚠️ Responsabilidad de backups y HA recae en el equipo.
- ⚠️ Requiere proxy TLS para exponer endpoint público (si se usan presigned URLs).
- ⚠️ Monitoreo adicional (Prometheus + Grafana).

### Detalles de configuración
- `forcePathStyle: true` obligatorio.
- Dos endpoints: interno (contenedor↔contenedor) y público (browser).
- Buckets privados. Nunca `mc anonymous set download`.
- Acceso a archivos siempre por proxy API o presigned URLs cortas.

### Alternativas
- AWS S3: descartado por costos.
- Backblaze B2: descartado por dependencia de terceros.
- Sistema de archivos local + Nginx: descartado por falta de API S3.

---

## ADR-011 — Baileys para WhatsApp

**Estado:** Aceptado
**Fecha:** 2026-10-12

### Contexto
Notificaciones y envío de recibos por WhatsApp.

### Decisión
Usar **Baileys** (cliente no oficial).

### Consecuencias
- ✅ Sin costos por mensaje.
- ✅ Control total de sesión.
- ⚠️ No oficial → riesgo de bloqueo por Meta.
- ⚠️ Requiere monitoreo de sesión.

### Alternativas
- WhatsApp Business API: descartado por costos y aprobación.
- Twilio: descartado por costo.

**Nota:** si en v2 se justifica, migrar a WhatsApp Business API oficial.

---

## ADR-012 — Firebase Cloud Messaging para push

**Estado:** Aceptado
**Fecha:** 2026-10-12

### Contexto
Notificaciones push a la app móvil (futura).

### Decisión
FCM (firebase-admin).

### Consecuencias
- ✅ Estándar de facto.
- ✅ Multiplataforma.
- ⚠️ Dependencia de Google.

---

## ADR-013 — Idempotencia con Redis

**Estado:** Aceptado
**Fecha:** 2026-10-12

### Contexto
Endpoints críticos (pagos, aprobaciones) no deben duplicar efectos por reintentos.

### Decisión
Idempotency-Key en header, guardado en Redis por 24h con hash del payload.

### Consecuencias
- ✅ Reintentos seguros.
- ✅ Protección contra doble click.
- ⚠️ Requiere Redis disponible.

### Alternativas
- Tabla en DB: descartado por presión sobre DB.
- Idempotencia natural por constraint: no cubre todos los casos.

---

## ADR-014 — Aplicación dirigida de pagos (no FIFO automático)

**Estado:** Aceptado
**Fecha:** 2026-10-12

### Contexto
El residente debe poder elegir qué meses pagar.

### Decisión
Aplicación **dirigida** por selección de meses. FIFO queda como opción futura.

### Consecuencias
- ✅ Transparencia para el residente.
- ✅ Control del usuario.
- ⚠️ Requiere UI de selección múltiple.

### Alternativas
- FIFO automático: descartado por falta de control.
- LIFO: descartado por no ser intuitivo.

---

## ADR-015 — Alícuota reservada, no implementada en v1

**Estado:** Aceptado
**Fecha:** 2026-10-12

### Contexto
Algunos condominios usan alícuota por unidad. El cliente decidió no usarla en v1.

### Decisión
Dejar los campos `area_m2` y `aliquot_pct` en `units` como reservados. No implementar cálculos.

### Consecuencias
- ✅ Preparado para v2 sin migración.
- ⚠️ Documentar que no aplica.

---

## 📌 Plantilla para nuevos ADR

```markdown
## ADR-NNN — Título

**Estado:** Propuesto | Aceptado | Reemplazado por ADR-XXX | Deprecado
**Fecha:** YYYY-MM-DD

### Contexto
...

### Decisión
...

### Consecuencias
- ✅ ...
- ⚠️ ...

### Alternativas
- ...



```markdown
## ADR-016 — Dokploy + Docker para deployment

**Estado:** Aceptado
**Fecha:** 2026-10-12

### Contexto
El proyecto requiere deployment simple, con SSL automático, gestión de bases de datos, backups y webhooks de CI/CD, sin montar Kubernetes ni infraestructura compleja. El equipo es pequeño y prioriza velocidad de iteración sobre personalización extrema.

### Decisión
Usar **Dokploy self-hosted** sobre **Docker** como plataforma única de deployment.

Componentes:
- Apps `api` y `web`: desplegadas vía **Dockerfile multi-stage** (Turborepo + pnpm).
- `postgres` y `redis`: **databases nativas** de Dokploy (con backups y métricas).
- `minio`: **Docker Compose Application** (no es DB nativa).
- Reverse proxy y SSL: **Traefik** gestionado por Dokploy.
- CI/CD: **GitHub Actions** para calidad + **webhooks de Dokploy** para deploy.

### Consecuencias
- ✅ Deploy simple con UI.
- ✅ SSL automático (Let's Encrypt).
- ✅ Backups gestionados para DB nativas.
- ✅ Rollback desde UI.
- ✅ Webhook de GitHub → deploy automático.
- ✅ Bajo costo operativo (un solo servidor).
- ⚠️ Dependencia de Dokploy (open-source, sin SLA).
- ⚠️ Menos flexible que Kubernetes para escalado avanzado.
- ⚠️ Backups de MinIO requieren script propio.
- ⚠️ Dockerfiles propios para el monorepo.

### Alternativas
- **Kubernetes**: descartado por complejidad operativa.
- **Docker Swarm puro**: descartado por falta de UI y automatización.
- **Vercel + Railway**: descartado por costos y vendor lock-in.
- **Coolify**: similar a Dokploy, descartado por preferencia del equipo.
- **Deploy manual con Docker Compose**: descartado por falta de SSL, backups y rollback.

### Notas de implementación
- Dockerfiles en `/dokploy/`.
- Compose de MinIO en `/dokploy/minio.compose.yml`.
- Cada entorno (dev/staging/prod) tiene su propio proyecto en Dokploy.
- Los secretos se gestionan en Dokploy UI, nunca en repo.
- Migraciones se ejecutan como job previo al deploy.