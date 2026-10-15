---
id: 01-CONTEXT
title: Visión, alcance y glosario
version: 1.0
audience: human+agent
last_updated: 2026-10-12
---

# 01 — Contexto del Producto SGC

## 🎯 Visión

**SGC** es un SaaS multi-tenant para la administración integral de **condominios de edificios** y **residencias habitacionales (casas)**.

Su objetivo es reemplazar el uso disperso de hojas de cálculo, cuadernos y mensajería por una plataforma única que centraliza:

- Personal, contratos, asistencia y nómina.
- Gastos operativos y cuentas por pagar a proveedores.
- Cobranza ordinaria y extraordinaria con multimoneda y mora parametrizable.
- Pagos offline con comprobante y aprobación por administrador.
- Conciliación bancaria mediante parsers por banco.
- Documentos formales (actas), incidencias y quejas comunitarias.
- Reportes exportables (Excel y PDF).
- Notificaciones push (Firebase) y WhatsApp (Baileys).

---

## 🌎 Contexto de mercado

- **Región objetivo inicial:** América Latina (Venezuela como caso base).
- **Idiomas:** Español, Inglés, Francés, Portugués.
- **Modelo de tenancy:** SaaS multi-empresa.
- **Dimensionamiento año 1:** 10 tenants.

---

## 🎭 Actores y roles

| Actor | Descripción |
|---|---|
| **Super Admin** | Dueño del SaaS. Administra tenants y configuración global. |
| **Admin de tenant** | Dueño de la administradora. Gestiona sus condominios y usuarios. |
| **Admin de condominio** | Opera un condominio específico. Único que puede crear admins. |
| **Junta de condominio** | Visibilidad de reportes, aprueba cuotas extraordinarias. |
| **Residente / Propietario** | Ve estado de cuenta, sube comprobantes, consulta actas. |
| **Contador / Auditor** | Acceso a reportes financieros y conciliación. |
| **Personal** | Trabajadores del condominio. Solo ven su información. |

---

## 🎯 Alcance v1 (in-scope)

1. Multi-tenant con switch de condominio por usuario.
2. Gestión completa de condominios (edificios y casas).
3. Residentes con propiedades en N condominios.
4. Personal, contratos, asistencia, nómina y adelantos.
5. Cobranza: cuotas ordinarias/extraordinarias, impuestos, multimoneda, mora.
6. Pagos offline con comprobante; registro también por administrador.
7. Estado `approved_pending_data` para pagos aprobados sin datos completos.
8. Gastos operativos, proveedores y cuentas por pagar.
9. Conciliación bancaria con parser por banco.
10. Actas, incidencias, quejas.
11. Reportes exportables (Excel/PDF).
12. Notificaciones push + WhatsApp.
13. Auditoría transversal y soft delete universal.
14. i18n en 4 idiomas.
15. Personalización visual por condominio (colores + logo).

---

## 🚫 Fuera de alcance v1 (out-of-scope)

Detalle en `docs/17-FUTURE-SCOPE.md`. Resumen:

- Integración tributaria / facturación fiscal.
- Pagos en línea con pasarela.
- Autenticación 2FA.
- Alícuota por unidad (campo reservado, lógica no implementada).
- App móvil nativa (solo notificaciones push).
- OCR de comprobantes.
- Multi-región.
- Integraciones con ERP.

**Regla:** lo listado aquí no se implementa sin ADR explícito que lo promueva.

---

## 📈 KPIs de éxito

| KPI | Objetivo |
|---|---|
| Tiempo de aprobación de pago | < 5 s tras acción del admin |
| Tiempo de parsing de TXT bancario (1.000 movimientos) | < 10 s |
| Concurrencia sostenida en días de pago | 500 req/s p95 < 300 ms |
| Fuga de datos entre tenants | 0 (validado con tests) |
| Cobertura de tests en dominios críticos | ≥ 80% |
| Disponibilidad mensual | ≥ 99.5% |

---

## 📖 Glosario

| Término | Definición |
|---|---|
| **Tenant** | Una administradora cliente del SaaS. |
| **Condominio** | Unidad lógica de administración: edificio o residencia. |
| **Edificio** | Estructura con pisos y apartamentos. |
| **Bloque / Etapa** | Agrupación de casas en una residencia. |
| **Unidad** | Apartamento o casa. Entidad mínima facturable. |
| **Residente** | Persona que ocupa una unidad. Puede o no ser propietario. |
| **Propietario** | Persona dueña de una unidad. Puede tener N propiedades. |
| **Cuota ordinaria** | Pago mensual fijo o variable por gastos comunes. |
| **Cuota extraordinaria** | Pago puntual aprobado en asamblea para gasto específico. |
| **Alícuota** | Porcentaje de gastos comunes asignado a cada unidad. En v1 solo campo reservado. |
| **Mora** | Recargo por pago atrasado. Fija o porcentual. |
| **Mora configurable** | Política del condominio sobre cómo se aplica la mora. |
| **Multimoneda** | Soporte para pagos en moneda base y moneda extranjera. |
| **Comprobante** | Imagen o PDF que el residente sube como prueba de pago. |
| **Pago asistido** | Pago registrado por el administrador en nombre del residente. |
| **Approved pending data** | Pago aceptado que impacta el estado de cuenta pero sin comprobante ni referencia. |
| **Conciliación bancaria** | Proceso de cruzar movimientos bancarios con pagos registrados. |
| **Parser bancario** | Estrategia de lectura de archivos TXT de un banco específico. |
| **Acta** | Documento formal por incumplimiento o decisión de asamblea. |
| **Incidencia** | Falla en instalaciones o áreas comunes. |
| **Queja** | Manifestación de un residente contra otro o contra el condominio. |
| **Mora FIFO** | Aplicación de pago a la deuda más antigua primero. |
| **Mora dirigida** | Aplicación manual por selección de meses específicos. |
| **SPT** | Shared Pool Tenant — todos los tenants comparten DB con `tenant_id`. |
| **RLS** | Row Level Security — política de aislamiento a nivel de PostgreSQL. |
| **Soft delete** | Marcar como eliminado sin borrar físicamente. |
| **Facade** | Punto de entrada público de un módulo hacia otros módulos. |
| **Idempotencia** | Capacidad de repetir una petición sin efectos duplicados. |
| **Scalar** | Herramienta de documentación de APIs OpenAPI. |