---
id: 12-API-CONTRACTS
title: Contratos de API REST
version: 1.0
audience: human+agent
last_updated: 2026-10-12
---

# 12 — Contratos de API

> Estándar único para todos los endpoints. Si un endpoint se desvía, requiere ADR.

---

## 🎯 Principios

1. **RESTful** con convenciones consistentes.
2. **Versionado** en la URL: `/api/v1/...`.
3. **Idempotencia** en mutaciones críticas.
4. **Errores uniformes** con formato `{ code, message, details }`.
5. **Documentación automática** con Scalar.
6. **Paginación obligatoria** en listados.
7. **Validación Zod** en el borde.

---

## 🧭 Convenciones REST

### Recursos

- Plural: `/payments`, `/units`, `/staff`.
- Nunca verbos: ❌ `/getPayments`.
- Acciones no-CRUD como sub-recursos: `POST /payments/:id/approve`.

### Verbos HTTP

| Verbo | Uso |
|---|---|
| `GET` | Lectura (idempotente, sin efectos) |
| `POST` | Creación o acción no idempotente |
| `PATCH` | Actualización parcial |
| `PUT` | Reemplazo completo (raro en este proyecto) |
| `DELETE` | **No usar** — siempre `PATCH .../deactivate` (soft delete) |

### Estructura de rutas
/api/v1/<recurso>
/api/v1/<recurso>/:id
/api/v1/<recurso>/:id/<subrecurso>
/api/v1/<recurso>/:id/<accion>
/api/v1/me/<recurso>


### Headers obligatorios

| Header | Cuándo | Descripción |
|---|---|---|
| `Authorization: Bearer <jwt>` | Todos salvo públicos | Token de acceso |
| `X-Condominium-Id: <uuid>` | Endpoints que operan en un condominio | Condominio activo |
| `Idempotency-Key: <uuid>` | POST/PATCH mutantes críticos | Garantía de no duplicación |
| `X-Request-Id: <uuid>` | Opcional | Correlación |
| `Accept-Language: <locale>` | Opcional | Fuerza locale de respuesta |

### Códigos de estado

| Código | Uso |
|---|---|
| 200 | OK (lectura, actualización) |
| 201 | Created (POST que crea) |
| 202 | Accepted (tareas asíncronas: exportaciones, conciliaciones) |
| 204 | No Content (acciones sin retorno) |
| 400 | Bad Request (validación Zod) |
| 401 | Unauthorized (sin token o expirado) |
| 403 | Forbidden (sin permiso o sin acceso al condominio) |
| 404 | Not Found |
| 409 | Conflict (duplicado, estado inválido) |
| 413 | Payload Too Large (uploads) |
| 422 | Unprocessable Entity (regla de negocio) |
| 429 | Too Many Requests (rate limit) |
| 500 | Internal Server Error |

---

## 📦 Formato de respuestas

### Éxito

**Recurso simple:**
```json
{
  "id": "uuid",
  "field": "value",
  "createdAt": "2026-10-12T14:32:00Z"
}

Listado:
{
  "data": [ { "id": "..." }, { "id": "..." } ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 145,
    "totalPages": 8
  }
}

Acción sin retorno:
204 No Content

Tarea asíncrona:
{
  "jobId": "uuid",
  "status": "pending",
  "estimatedTime": 30
}

Error
Formato único:
{
  "code": "PAYMENT_NOT_FOUND",
  "message": "El pago no existe.",
  "details": {
    "paymentId": "uuid"
  },
  "requestId": "uuid"
}

Reglas:

- code: UPPER_SNAKE_CASE, único en el sistema, prefijado por módulo.
- message: human-readable, ya traducido al locale del usuario.
- details: objeto opcional con contexto (campos inválidos, IDs).
- requestId: para correlación en logs.

Errores de validación
{
  "code": "VALIDATION_ERROR",
  "message": "Hay errores en los datos enviados.",
  "details": {
    "fields": [
      { "path": "amount", "message": "Debe ser un número positivo" },
      { "path": "currency", "message": "Debe tener 3 letras" }
    ]
  }
}

🔢 Paginación
Estándar

Query params:
?page=1&limit=20

page (default 1, mínimo 1).
limit (default 20, máximo 100).

Ordenamiento
?sort=-created_at
Sin prefijo: ascendente.

Con -: descendente.

Múltiples: ?sort=-created_at,name.

Filtros
Query params con nombres claros:
?status=approved&from=2026-01-01&to=2026-12-31


### 🔐 Autenticación

Endpoints públicos

POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/resident-link-requests (registro de residente)
GET /api/v1/condominiums/search (búsqueda para vinculación)

Todos los demás requieren Authorization: Bearer.

Flujo de errores
Situación	Código HTTP	Código error
Sin token	401	AUTH_REQUIRED
Token expirado	401	AUTH_TOKEN_EXPIRED
Token inválido	401	AUTH_TOKEN_INVALID
Sin permiso	403	PERMISSION_DENIED
Condominio sin acceso	403	CONDOMINIUM_ACCESS_DENIED

### ⚡ Idempotencia
Cuándo aplicar
Obligatorio en:

POST /payments
POST /payments/admin
PATCH /payments/:id/approve
PATCH /payments/:id/complete-data
POST /bank-imports
PATCH /reconciliation-matches/:id/approve
POST /reports/export

Cómo funciona
1. Cliente envía Idempotency-Key: <uuid>.
2. Backend guarda en Redis: idempotency:<key> → { hash, response, ttl }.
3. Si la key existe con el mismo hash → devuelve la misma respuesta.
4. Si la key existe con hash distinto → 409 IDEMPOTENCY_KEY_CONFLICT.
5. TTL: 24 horas.

🚦 Rate limiting
Endpoint	Límite
Login	5/min por IP
Refresh	20/min por usuario
API general	300/min por usuario
Uploads	30/min por usuario
Reportes	10/min por usuario
Conciliación	5/hora por condominio

Respuesta al exceder:
429 Too Many Requests
Retry-After: 60

Código: RATE_LIMIT_EXCEEDED.

📤 Uploads
Endpoints

POST /api/v1/files/upload
Content-Type: multipart/form-data

Parámetros:

file: archivo binario.

purpose: receipt | contract | minute | incident | branding.

Restricciones
Tipo	Tamaño máx	MIME
Comprobante	10 MB	image/ * , application/pdf
Contrato	20 MB	application/pdf
Acta	20 MB	application/pdf, image/ *
Logo	2 MB	image/png, image/svg+xml

Respuesta
{
  "fileId": "uuid",
  "key": "receipts/tenant/2026/10/uuid.jpg",
  "url": "/api/v1/files/<id>/download",
  "size": 124567,
  "mimeType": "image/jpeg"
}

Descarga
Todos los archivos se sirven a través de la API (proxy), nunca con URLs públicas directas a MinIO.
GET /api/v1/files/:id/download

Valida permisos, tenant, condominio, y hace streaming desde MinIO.

📚 Documentación con Scalar
Configuración
OpenAPI 3.1 generado automáticamente por decoradores NestJS.

Publicado en /api/v1/docs.

Autenticación configurable desde la UI.

Decoradores obligatorios

@ApiTags('payments')
@ApiOperation({ summary: 'Registrar pago por admin' })
@ApiResponse({ status: 201, type: PaymentResponseDto })
@ApiResponse({ status: 400, description: 'Validación' })
@ApiResponse({ status: 409, description: 'Duplicado' })
@Controller('payments')
export class PaymentsController {}

Ejemplos
Cada endpoint debe incluir ejemplos de request y response en los decoradores.

📛 Catálogo de códigos de error

Auth / Identity:

AUTH_REQUIRED
AUTH_TOKEN_EXPIRED
AUTH_TOKEN_INVALID
AUTH_INVALID_CREDENTIALS
AUTH_ACCOUNT_INACTIVE
AUTH_TOO_MANY_ATTEMPTS
PERMISSION_DENIED
CONDOMINIUM_ACCESS_DENIED
TENANT_MISMATCH

Condominiums:

CONDOMINIUM_NOT_FOUND
CONDOMINIUM_CODE_DUPLICATE
CONDOMINIUM_TYPE_CHANGE_FORBIDDEN
CONDOMINIUM_HAS_ACTIVE_CHARGES
UNIT_NOT_FOUND
UNIT_CODE_DUPLICATE
STRUCTURE_HAS_UNITS

Properties / Residents:
PERSON_NOT_FOUND
PERSON_DOCUMENT_DUPLICATE
UNIT_ALREADY_OCCUPIED
LINK_REQUEST_PENDING
TRANSFER_MISSING_CONTRACT
TRANSFER_ALREADY_RESOLVED

Billing:

FEE_PLAN_NOT_FOUND
FEE_PLAN_REQUIRES_MINUTE
CHARGE_NOT_FOUND
CHARGE_ALREADY_PAID
CURRENCY_RATE_MISSING
MORA_RULE_NOT_FOUND

Payments:

PAYMENT_NOT_FOUND
PAYMENT_ALREADY_APPROVED
PAYMENT_ALREADY_COMPLETE
PAYMENT_ALREADY_REJECTED
PAYMENT_METHOD_INACTIVE
PAYMENT_AMOUNT_MISMATCH
IDEMPOTENCY_KEY_CONFLICT

Bank Reconciliation:

BANK_ACCOUNT_NOT_FOUND
BANK_IMPORT_FAILED
BANK_PARSER_NOT_FOUND
RECONCILIATION_MATCH_NOT_FOUND
MOVEMENT_ALREADY_MATCHED

Minutes / Incidents / Complaints:

MINUTE_NOT_FOUND
MINUTE_NOT_EDITABLE
MINUTE_SEQUENCE_ERROR
INCIDENT_NOT_FOUND
COMPLAINT_NOT_FOUND

Files:

FILE_NOT_FOUND
FILE_TOO_LARGE
FILE_TYPE_NOT_ALLOWED

Generales:

VALIDATION_ERROR
INTERNAL_ERROR
RATE_LIMIT_EXCEEDED
RESOURCE_NOT_FOUND

🔄 Versionado de API

Versión actual: v1.
Cambios breaking → nueva versión /api/v2.
Período de coexistencia: 6 meses mínimo.
Deprecación anunciada vía header Sunset.

Cambio breaking:

Quitar un campo de respuesta.
Cambiar tipo de un campo.
Cambiar semántica de un endpoint.
Quitar un endpoint.

Cambio no-breaking:

Agregar campo opcional.
Agregar endpoint.
Agregar valor a un enum de respuesta (documentar).

🌐 CORS

Origen permitido: solo el dominio del frontend.
Métodos: GET, POST, PATCH, OPTIONS.
Headers permitidos: Authorization, Content-Type, X-Condominium-Id, Idempotency-Key.
Credenciales: no (usamos JWT en header).

🕐 Timestamps

Todos en UTC, formato ISO 8601: 2026-10-12T14:32:00Z.
El cliente renderiza en timezone del condominio.
Nunca enviar timestamps sin zona.

💰 Montos

Formato: número decimal + moneda separada.
Ejemplo:
json
{
  "amount": 1000.50,
  "currency": "USD"
}
Nunca enviar montos como string.
Nunca asumir moneda: siempre explícita.

🚫 Reglas duras

Ningún endpoint sin @RequirePermission (salvo públicos explícitos).
Ningún listado sin paginación.
Ningún error sin code.
Ningún mutation sin auditoría.
Ningún endpoint mutante crítico sin Idempotency-Key.
Ningún mensaje de error hardcodeado (i18n).
Ninguna respuesta con entidad de dominio cruda (siempre DTO).