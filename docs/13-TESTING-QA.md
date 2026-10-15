
---

## 🗂️ `docs/13-TESTING-QA.md`

---
id: 13-TESTING-QA
title: Estrategia de testing y QA
version: 1.0
audience: human+agent
last_updated: 2026-10-12
---

# 13 — Testing y QA

---

## 🎯 Objetivos

1. Prevenir regresiones en lógica de negocio.
2. Garantizar aislamiento multi-tenant.
3. Validar flujos críticos end-to-end.
4. Asegurar performance bajo carga.
5. Documentar comportamiento esperado.

---

## 🔺 Pirámide de testing

┌─────────────┐
│ E2E (5%) │ Playwright
├─────────────┤
│ Integration │ Vitest + Testcontainers
│ (25%) │
├─────────────┤
│ │
│ Unit │ Vitest
│ (70%) │
└─────────────┘


---

## 🧪 Tipos de test

### Unit tests

- **Qué:** lógica de dominio pura, value objects, reglas de negocio.
- **Herramienta:** Vitest.
- **Ubicación:** junto al archivo (`*.spec.ts`).
- **Sin DB, sin HTTP, sin red.**

Ejemplo:

describe('calculateMora', () => {
  it('should apply fixed mora BR-006', () => {
    const result = calculateMora({ type: 'fixed', value: 50 }, 1000);
    expect(result).toBe(50);
  });

  it('should apply percentage mora BR-006', () => {
    const result = calculateMora({ type: 'percentage', value: 5 }, 1000);
    expect(result).toBe(50);
  });
});

### Integration tests

- **Qué:** servicios de aplicación + repositorios + DB real.
- **Herramienta:** Vitest + Testcontainers (PostgreSQL, Redis, MinIO).
- **Ubicación:** test/integration/.
- **Sin HTTP (llamada directa al servicio).**

Ejemplo:
describe('PaymentsService', () => {
  it('should set approved_pending_data when no receipt or reference (BR-012)', async () => {
    const payment = await service.registerAdminPayment({
      unitId,
      amount: 100,
      referenceNumber: null,
      receiptFile: null,
    });
    expect(payment.status).toBe('approved_pending_data');
    expect(payment.pendingDataReason).toBeDefined();
  });
});

### E2E tests

- **Qué:** flujos completos desde el navegador o vía API.
- **Herramienta:** Playwright (UI) + Supertest (API).
- **Ubicación:** test/e2e/.
- **Cubren:** login, pago, aprobación, switch de condominio.
Ejemplo:
test('resident uploads payment and admin approves', async ({ page }) => {
  await page.goto('/login');
  await login(page, 'resident@test.com', 'password');
  await page.click('text=Pagar cuota');
  await page.check('input[value="2026-01"]');
  await page.setInputFiles('input[type=file]', 'receipt.jpg');
  await page.click('text=Enviar pago');
  await expect(page.locator('text=Pago enviado')).toBeVisible();
});

### Load tests

- **Qué:** endpoints críticos bajo carga.
- **Herramienta:** k6.
- **Objetivo:** 500 req/s con p95 < 300 ms.

Ejemplo:

export const options = {
  stages: [
    { duration: '1m', target: 100 },
    { duration: '2m', target: 500 },
    { duration: '1m', target: 0 },
  ],
};

export default function () {
  http.get(`${BASE_URL}/api/v1/payments`);
}


## 📊 Cobertura mínima
| Capa | Cobertura mínima |
| -- | -- |
| **Domain (lógica pura)** | **80%** |
| **Application services** | **70%** |
| **Repositories** | **50%** |
| **Controllers** | **60%** |
| **Frontend (componentes)** | **60%** |
CI bloquea si cae por debajo.

🎯 **Escenarios críticos obligatorios

Multi-tenancy
□ Usuario de tenant A no puede leer datos de tenant B.
□ Usuario de condominio X no puede leer datos de Y.
□ Todas las tablas tienen RLS habilitado.
□ Query sin tenant_id falla con RLS.

Soft delete
□ Usuario desactivado no puede login.
□ Unidad desactivada no genera nuevos cargos.
□ Registros con deleted_at no aparecen en listados.

Auditoría
□ Toda mutación genera audit_logs.
□ Login/logout quedan registrados.
□ Intento 403 queda registrado.
□ PII enmascarada en logs.

Pagos
□ Pago aprobado sin datos → approved_pending_data.
□ Completar datos → approved.
□ Impacto en unit_charges idéntico en ambos estados.
□ Idempotencia respetada.
□ Recibo PDF descargable en ambos estados.

Cobranza
□ Impuesto agregado vs incluido.
□ Mora fija vs porcentual.
□ Conversión multimoneda.
□ Cuota extraordinaria requiere acta.
□ Generación mensual no duplica cargos.
Conciliación

□ Parser Banesco lee TXT correctamente.
□ + → crédito, - → débito.
□ Coma decimal y punto de miles bien interpretados.
□ Comisiones se registran como gasto.
□ Duplicados detectados.

Actas
□ Numeración consecutiva sin huecos.
□ Edición bloqueada tras emitir.
□ Hash de integridad calculado.

Quejas
□ Queja anónima preserva identidad.
□ Notificación llega al involucrado.


## 🏗️ Infraestructura de test

Testcontainers
Levanta PostgreSQL, Redis y MinIO en containers efímeros por suite.
beforeAll(async () => {
  postgres = await new GenericContainer('postgres:16')
    .withEnvironment({ POSTGRES_PASSWORD: 'test' })
    .withExposedPorts(5432)
    .start();
  // ...
});

Seeds de test

- 2 tenants.
- 3 condominios por tenant.
- 10 unidades por condominio.
- Usuarios por rol.
- Datos de cobranza y pagos.

Factories
const paymentFactory = new PaymentFactory();
const payment = paymentFactory.create({ status: 'approved' });

🧬 Mocks

Servicios externos

- Firebase: mock del SDK.
- Baileys: mock del cliente.
- MinIO: Testcontainers real (no mock).

Tiempo
- Usar vi.useFakeTimers() para tests con vencimiento y mora.
- Nunca Date.now() directo en dominio.

🚦 CI/CD
En cada PR:
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:integration
pnpm i18n:check
pnpm test:e2e:smoke

En merge a develop

- Suite completa E2E.
- Deploy a staging.

En merge a main

- Todo lo anterior.
- Load tests (k6).
- Deploy a producción.

🐛 Gestión de bugs

Reporte

- Título descriptivo.
- Pasos para reproducir.
- Comportamiento esperado vs actual.
- Entorno (dev/staging/prod).
- Screenshots o logs.

Ciclo

1. Reproducir.
2. Escribir test que falla.
3. Arreglar causa raíz.
4. Test pasa.
5. PR.

Regla: ningún bug se cierra sin test de regresión.

### 📏 Métricas

- Cobertura por módulo.
- Número de tests por capa.
- Tiempo de ejecución.
- Flakiness (< 1%).
- Bugs encontrados en prod vs staging.

### 🧪 Test de aislamiento multi-tenant (obligatorio)

Test automático que:

1. Crea 2 tenants con datos.
2. Autentica en tenant A.
3. Intenta leer datos de tenant B por ID directo.
4. Espera 404.
5. Repite para cada tabla principal.

Este test corre en CI. Si falla, bloquea el merge.

### 📌 Reglas duras

1. Ningún PR sin tests.
2. Ningún bug cerrado sin test de regresión.
3. Cobertura mínima por capa respetada.
4. Test de aislamiento siempre verde.
5. Tests rápidos (< 5 min unit+integration).
6. Nunca test.skip sin issue asociado.
7. Nunca console.log en tests.
8. Datos de test aislados por suite.

