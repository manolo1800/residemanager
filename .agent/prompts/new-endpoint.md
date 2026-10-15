---
id: AGENT-PROMPT-NEW-ENDPOINT
title: Prompt — Crear un endpoint nuevo
version: 1.0
audience: agent
used_by_agent_when: "cuando el usuario pide un endpoint nuevo en un módulo existente"
---

# `.agent/prompts/new-endpoint.md`

## 🎯 Cuándo usarlo

- "Agrega un endpoint para listar pagos por unidad."
- "Necesito poder descargar el recibo de un pago."
- "Crea un endpoint para aprobar múltiples pagos a la vez."

---

## 🚦 Protocolo obligatorio

### Paso 1 — Cargar contexto

Lee en este orden:
1. `AGENTS.md`
2. `.agent/context.md`
3. `.agent/coding-standards.md`
4. `docs/12-API-CONTRACTS.md`
5. `docs/11-MODULES/<M0X>.md`
6. `docs/05-SECURITY-MULTITENANCY.md`

### Paso 2 — Verificar alcance

- ¿El endpoint cae dentro del propósito del módulo?
- ¿La acción ya existe con otro verbo/ruta? → **no dupliques**.
- ¿Necesita una regla de negocio nueva? → consultar `docs/07`.
- ¿Necesita permiso nuevo? → consultar `docs/05`.

### Paso 3 — Definir contrato

Antes de codear, presenta:
Endpoint: <MÉTODO> /api/v1/<recurso>
Módulo: <M0X>
Propósito: <1 línea>
Auth: <rol + permiso>
Request:

path params: ...

query params: ...

body: ...
Response:

200: { ... }

400: { code, message }

403: { code, message }

404: { code, message }
Idempotencia: sí / no
Paginación: sí / no


### Paso 4 — Implementar

Orden:
1. DTO con Zod.
2. Servicio de aplicación (caso de uso).
3. Método en el facade (si lo consumen otros módulos).
4. Controller.
5. Guard de permisos.
6. Auditoría (si muta).
7. i18n de mensajes.

### Paso 5 — Tests

- Integration test del happy path.
- Test de cada error esperado (400, 403, 404, 409).
- Test de idempotencia si aplica.
- Test de aislamiento multi-tenant (otro tenant recibe 404).

### Paso 6 — Documentación

- Actualizar `docs/11-MODULES/<M0X>.md` (lista de endpoints).
- Actualizar `docs/12-API-CONTRACTS.md` si introduce patrón nuevo.
- Scalar se actualiza automáticamente vía decoradores NestJS.

### Paso 7 — Checklist

Correr `.agent/pr-checklist.md`.

---

## 📐 Reglas de diseño de endpoints

- Plural en recursos: `/payments`, no `/payment`.
- Verbos HTTP correctos: GET, POST, PATCH, PUT, DELETE.
- No usar verbos en la ruta (`/getPayments` ❌).
- Acciones no-CRUD como sub-recursos: `POST /payments/:id/approve`.
- Versionado: `/api/v1/...`.
- Paginación estándar: `?page=1&limit=20`.
- Filtros: `?status=approved&from=2026-01-01`.
- Ordenamiento: `?sort=-created_at`.
- Errores consistentes: `{ code, message, details }`.
- Idempotencia: header `Idempotency-Key` en POST/PATCH mutantes.

---

## 🧪 Ejemplo completo

**Request:**
POST /api/v1/payments/:id/complete-data
Headers:
Authorization: Bearer <jwt>
Idempotency-Key: <uuid>
Body:
{
"reference_number": "70170637515",
"phone_from": "04129062434",
"receipt_file": "base64..."
}


**Response 200:**
```json
{
  "id": "uuid",
  "status": "approved",
  "data_completed_at": "2026-10-12T14:32:00Z",
  "data_completed_by": "user_uuid"
}

**Response 409**  
``json
(ya estaba completo):
{
  "code": "PAYMENT_ALREADY_COMPLETE",
  "message": "El pago ya tiene los datos completos."
}


### 🚫 Errores comunes

- Usar POST para lecturas.
- No paginar listados grandes.
- Devolver la entidad de dominio cruda.
- No documentar los códigos de error.
- No aplicar permisos.
- No aplicar idempotencia cuando muta.
- Ignorar filtros de tenant.


### ✅ Señales de que salió bien

- El endpoint aparece en Scalar con ejemplos.
- Tiene test de cada caso de error.
- Los mensajes están en i18n.
- La doc del módulo lo lista.
- El PR pasa el checklist sin observaciones.



