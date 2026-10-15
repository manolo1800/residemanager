---
id: AGENT-BOUNDARIES
title: Fronteras — qué NO tocar ni construir
version: 1.0
audience: agent
used_by_agent_when: "antes de proponer cualquier cambio estructural"
---

# `.agent/boundaries.md`

> Define lo que el agente **nunca** debe hacer sin autorización explícita.
> Si algo aquí te bloquea, **pregunta al usuario** antes de improvisar.

---

## 🚫 NO tocar sin autorización

| Área | Motivo |
|---|---|
| Modelo de datos (`docs/04-DATA-MODEL.md`) | Requiere migración y revisión de RLS |
| Políticas RLS | Rompe aislamiento multi-tenant |
| Contratos de API públicos | Rompe clientes y frontend |
| Reglas de negocio (`docs/07`) | Requiere validación de dominio |
| ADRs existentes (`docs/16`) | Son decisiones cerradas |
| Estructura del monorepo | Afecta a todo el equipo |
| Pipeline CI/CD | Afecta despliegues |
| Variables de entorno | Rompe entornos |
| Configuración de seguridad | Rompe aislamiento |
| Estructura de un módulo | Rompe convención |

---

## 🚫 NO construir (fuera de alcance v1)

Según `docs/17-FUTURE-SCOPE.md`:

- Integración tributaria / facturación fiscal.
- Pagos en línea con pasarela.
- Autenticación 2FA.
- Alícuota por unidad (el campo existe, la lógica no se implementa).
- App móvil nativa.
- OCR de comprobantes.
- Multi-región.
- Integraciones con ERP.

**Regla:** si está en esta lista, **no se implementa** salvo ADR explícito que lo promueva.

---

## 🚫 NO importar entre módulos

Ejemplos prohibidos:

```ts
// ❌ PROHIBIDO
import { PaymentRepository } from '../payments/infrastructure/repositories/payment.repository';
import { Payment } from '../payments/domain/entities/payment.entity';

// ✅ PERMITIDO
import { PaymentsFacade } from '../payments/payments.facade';
Solo se puede importar:

El *.facade.ts público del otro módulo.

Tipos de eventos (*.event.ts).

DTOs compartidos en packages/contracts.

🚫 NO agregar dependencias
Stack cerrado en docs/03-TECH-STACK.md.

Si crees que falta una librería → pregunta y justifica.

Prohibido: librerías abandonadas, con <1k stars sin justificación, o con licencias incompatibles.

🚫 NO hardcodear
Strings de UI → i18n.

Colores → design tokens.

URLs externas → configuración.

Timezones → configuración por condominio.

Monedas → configuración por condominio.

Reglas de negocio → docs/07-BUSINESS-RULES.md.

🚫 NO romper el aislamiento multi-tenant
Nunca:

Queries sin tenant_id.

Endpoints que acepten tenant_id del cliente sin validar contra la sesión.

Tablas sin tenant_id.

Servicios que crucen tenants.

Logs que mezclen datos de tenants.

🚫 NO borrar datos
Nunca DELETE FROM.

Nunca DROP COLUMN sin ADR.

Nunca TRUNCATE.

Siempre soft delete (deleted_at) + status.

🚫 NO saltarse la auditoría
Toda mutación relevante pasa por AuditService.

Aplica a: creación, modificación, aprobación, rechazo, cancelación, cambio de estado.

No aplica a: lecturas, listados, exportaciones.

🚫 NO romper i18n
Ningún string visible al usuario sin clave de traducción.

Todos los locales (es/en/fr/pt) deben tener la clave.

Si agregas una clave nueva, agrégala en los 4 locales.

🧭 Zona gris — pregunta siempre
Cambiar el nombre de un endpoint existente.

Reordenar columnas en una tabla.

Cambiar un enum (agregar valor es OK, quitar requiere ADR).

Introducir un patrón nuevo no documentado.

Modificar la paleta UI (docs/06).

Cambiar la estructura de un archivo de módulo.

Agregar un estado nuevo a un flujo existente.

✅ Zona libre — puedes actuar
Escribir tests.

Corregir bugs dentro de un módulo sin alterar contratos.

Refactorizar internamente respetando el facade.

Agregar validaciones.

Agregar logs.

Agregar traducciones.

Documentar código.

Agregar tipos.

Mejorar performance sin cambiar comportamiento.