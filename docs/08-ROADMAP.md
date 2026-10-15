---
id: 08-ROADMAP
title: Roadmap por fases
version: 1.0
audience: human+agent
last_updated: 2026-10-12
---

# 08 — Roadmap

> Cada fase entrega un incremento funcional desplegable y testeable.
> El agente **solo trabaja en la fase activa** o en fases anteriores incompletas.

---

## 🧭 Resumen

| Fase | Nombre | Duración estimada | Estado |
|---|---|---|---|
| F0 | Fundaciones | 2 semanas | ✅ |
| F1 | Identidad, tenants y multi-condominio | 3 semanas | ✅ |
| F2 | Estructura física y propiedades | 2 semanas | ✅ |
| F3 | Residentes y vinculación | 2 semanas | ✅ |

| F4 | Cobranza | 4 semanas | ✅ |
| F5 | Pagos, comprobantes, recibos | 3 semanas | ✅ |
| F6 | Gastos y proveedores | 2 semanas | ✅ |
| F7 | Personal, nómina, asistencia | 4 semanas | ✅ |
| F8 | Conciliación bancaria | 3 semanas | ⏳ |
| F9 | Actas, incidencias, quejas | 2 semanas | ⏳ |
| F10 | Reportes y notificaciones | 3 semanas | ⏳ |
| F11 | Auditoría, seguridad, performance | 2 semanas | ⏳ |
| F12 | Futuro (post-v1) | — | 🔒 |

**Total estimado MVP:** ~32 semanas (8 meses).

---

## 🏗️ F0 — Fundaciones (2 semanas)

**Objetivo:** base técnica lista para construir todo lo demás.

**Tareas:**
- [x] Inicializar monorepo (Turborepo + pnpm).
- [x] Configurar `apps/api` (NestJS + Fastify).
- [x] Configurar `apps/web` (Next.js App Router).
- [x] Paquetes: `ui`, `contracts`, `config`, `database`, `i18n`, `storage`.
- [x] Docker Compose: PostgreSQL + Redis + MinIO.
- [x] CI/CD (GitHub Actions).
- [x] Lint, Prettier, Husky, commitlint.
- [x] Design system base (tokens, componentes atómicos).
- [x] Scaffold i18n (4 idiomas).
- [x] Configuración de entornos (dev/staging/prod).
- [x] Documentación `.agent/` y `docs/` publicada.

**Entregable:** monorepo funcional con "Hello World" multi-idioma desplegable (Completado).

**Dependencias:** ninguna.

---

## 🔐 F1 — Identidad, tenants y multi-condominio (3 semanas)

**Objetivo:** usuarios, tenants, roles, y switch de condominio.

**Tareas:**
- [x] Modelo `tenants`, `users`, `roles`, `permissions`.
- [x] Auth JWT (access + refresh) con Argon2id.
- [x] Middleware de contexto (tenant + condominio).
- [x] RBAC con permisos granulares.
- [x] RLS en PostgreSQL para todas las tablas creadas.
- [x] CRUD de tenants (SuperAdmin).
- [x] CRUD de condominios.
- [x] Configuración por condominio:
  - Zona horaria.
  - Formato de fecha.
  - Colores y logo.
  - Políticas propias.
- [x] **Switch de condominio** con header `X-Condominium-Id`.
- [x] Auditoría transversal.
- [x] Soft delete global.

**Entregable:** login, switch de condominio funcional, personalización visual persistida (Completado).

**Dependencias:** F0.

---

## 🏢 F2 — Estructura física y propiedades (2 semanas)

**Objetivo:** representar cualquier condominio real.

**Tareas:**
- [x] Alta de condominio tipo `buildings` (edificios, pisos, nomenclatura).
- [x] Alta de condominio tipo `houses` (bloques/etapas, casas).
- [x] CRUD de estructuras (`condo_structures`).
- [x] CRUD de unidades (`units`).
- [x] Áreas comunes (`common_areas`).
- [x] Estacionamientos (`parking_spots`).
- [x] Código identificador único por condominio.
- [x] Importador masivo de unidades (CSV).
- [x] Configuración operativa (multimoneda, impuestos, mora).
- [x] Búsqueda de condominio por nombre y dirección.

**Entregable:** se crea cualquier condominio y se ve su estructura (Completado).

**Dependencias:** F1.


---

## 👥 F3 — Residentes y vinculación (2 semanas)

**Objetivo:** residentes gestionan sus propiedades.

**Tareas:**
- [x] Registro de residente.
- [x] Búsqueda por nombre de residencia + dirección.
- [x] Vinculación con unidad → solicitud → aprobación.
- [x] Multi-propiedad por residente.
- [x] Traspaso de propiedad con contrato adjunto.
- [x] Historial de propietarios.
- [x] Perfil del residente.
- [x] Restricción: solo `condo_admin` principal crea admins.

**Entregable:** flujo completo residente → solicitud → aprobación (Completado).

**Dependencias:** F1, F2.

---

## 💰 F4 — Cobranza (4 semanas)

**Objetivo:** motor de cuotas, impuestos, multimoneda, mora.

**Tareas:**
- [x] Configuración de cuota ordinaria (fija/variable).
- [x] Cuotas extraordinarias (con acta/asamblea si aplica).
- [x] Impuestos: exento, %, incluido/agregado.
- [x] Multimoneda: base + extranjera + conversión.
- [x] Mora: fija o porcentual.
- [x] Pagos parciales (opcional / preparación).
- [x] Generación mensual de `unit_charges`.
- [x] Panel de morosidad.
- [x] Estado de cuenta por unidad.
- [x] Recalculo automático al cambiar configuración.

**Entregable:** cada unidad tiene su estado de cuenta correcto (Completado).

**Dependencias:** F1, F2, F3.

---

## 💳 F5 — Pagos, comprobantes, recibos (3 semanas)

**Objetivo:** ciclo completo de pago offline.

**Tareas:**
- [x] Medios de pago configurables por condominio.
- [x] Flujo residente: seleccionar meses → subir comprobante → datos.
- [x] Flujo admin: aprobar/rechazar.
- [x] **Registro de pago por admin** (pago asistido).
- [x] Estado `approved_pending_data`.
- [x] Completar datos de pago pendientes.
- [x] Recibo PDF descargable.
- [x] Notificaciones al aprobar/rechazar.
- [x] Filtro "Pagos pendientes de datos" en panel admin.

**Entregable:** ciclo completo de pago offline + pago asistido (Completado).

**Dependencias:** F4.

---

## 💸 F6 — Gastos y proveedores (2 semanas)

**Objetivo:** controlar egresos.

**Tareas:**
- [x] Categorías de gasto configurables.
- [x] Registro de gastos con comprobante.
- [x] Presupuesto mensual + alertas.
- [x] Proveedores + cuentas por pagar.
- [x] Pagos a proveedores.
- [x] Comisiones bancarias como gasto operativo.

**Entregable:** ingresos vs egresos completo (Completado).

**Dependencias:** F4.

---

## 👷 F7 — Personal, nómina, asistencia (4 semanas)

**Objetivo:** RRHH completo del condominio.

**Tareas:**
- [x] Trabajadores con 3 tipos de contrato.
- [x] Generador de contratos PDF.
- [x] Control de asistencia.
- [x] Nómina por períodos.
- [x] Recibos de nómina PDF.
- [x] Adelantos con descuento programado.
- [x] Documentos adjuntos.

**Entregable:** RRHH operativo (Completado).

**Dependencias:** F1, F2.

---

## 🏦 F8 — Conciliación bancaria (3 semanas)

**Objetivo:** cruzar movimientos bancarios con pagos.

**Tareas:**
- [ ] Múltiples cuentas bancarias por condominio.
- [ ] Parser Banesco (base inicial).
- [ ] Framework de parsers plug-in.
- [ ] Importación de TXT.
- [ ] Motor de matching con scoring.
- [ ] Reporte de inconsistencias.
- [ ] Aprobación manual de matches.
- [ ] Bandeja de huérfanos.
- [ ] Comisiones bancarias → gasto operativo.

**Entregable:** importar TXT → sugerencias → aprobar.

**Dependencias:** F5.

---

## 📄 F9 — Actas, incidencias, quejas (2 semanas)

**Objetivo:** documentación formal y comunitaria.

**Tareas:**
- [ ] Actas con numeración consecutiva.
- [ ] Estados y transiciones.
- [ ] Hash de integridad.
- [ ] Incidencias con asignación.
- [ ] Quejas anónimas o identificadas.
- [ ] Respuestas y cierre.
- [ ] Notificaciones a involucrados.

**Entregable:** módulos comunitarios operativos.

**Dependencias:** F1.

---

## 📊 F10 — Reportes y notificaciones (3 semanas)

**Objetivo:** visibilidad y comunicación.

**Tareas:**
- [ ] Reportes: estado de cuenta, morosidad, ingresos/egresos, presupuesto, conciliación, cuentas por pagar.
- [ ] Reporte de pagos pendientes de datos.
- [ ] Exportación Excel/PDF.
- [ ] Generación asíncrona para reportes grandes.
- [ ] Push con Firebase.
- [ ] WhatsApp con Baileys.
- [ ] Plantillas de notificación en 4 idiomas.

**Entregable:** sistema reporta y comunica.

**Dependencias:** F5, F6, F7, F8.

---

## 🛡️ F11 — Auditoría, seguridad, performance (2 semanas)

**Objetivo:** producción.

**Tareas:**
- [ ] Auditoría completa validada.
- [ ] Soft delete validado en todo el sistema.
- [ ] Tests unitarios, integración, E2E.
- [ ] Load testing con k6.
- [ ] Documentación Scalar completa.
- [ ] Deploy productivo.
- [ ] Observabilidad (logs, métricas, trazas).
- [ ] Backups configurados.

**Entregable:** sistema listo para 10 tenants.

**Dependencias:** todas las anteriores.

---

## 🔒 F12 — Futuro (post-v1)

Bloqueado. Requiere ADR explícito para promover.

- Integración tributaria / facturación fiscal.
- Pagos en línea con pasarela.
- Autenticación 2FA.
- Alícuota por unidad.
- App móvil nativa.
- OCR de comprobantes.
- Multi-región.
- Integraciones con ERP.

---

## 🎯 Criterios de "Definition of Done" por fase

Una fase se considera completa cuando:

1. Todas las tareas del checklist están marcadas.
2. Los tests (unit + integration + E2E) pasan.
3. La cobertura mínima se cumple.
4. La documentación está actualizada (`docs/11-MODULES/M0X-*.md`).
5. El PR pasa el checklist de `.agent/pr-checklist.md`.
6. Se hizo demo funcional al stakeholder.
7. No hay bugs críticos abiertos.
8. La fase está desplegada en `staging`.

---

## 📌 Reglas de trabajo por fase

- **No iniciar F(n+1)** sin cerrar F(n).
- **No agregar tareas nuevas** a una fase en curso salvo aprobación.
- **Cambios de alcance** requieren ADR.
- **Cambios de prioridad** se documentan en este archivo.

---

## 🔄 Estado actual

- Fases completadas: **F0 — Fundaciones**, **F1 — Identidad, tenants y multi-condominio**, **F2 — Estructura física y propiedades**, **F3 — Residentes y vinculación**, **F4 — Cobranza**, **F5 — Pagos, comprobantes, recibos**.
- Fase activa: **F6 — Gastos y proveedores**.
- Sprint actual: Sprint 6 (F6).
- % avance global: ~50% (F0 a F5 completadas).

Actualizar este bloque al inicio de cada sprint.