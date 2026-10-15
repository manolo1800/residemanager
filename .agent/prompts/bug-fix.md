
---

## 🗂️ `.agent/prompts/bug-fix.md`

```markdown
---
id: AGENT-PROMPT-BUG-FIX
title: Prompt — Corregir un bug
version: 1.0
audience: agent
used_by_agent_when: "cuando el usuario reporta un comportamiento incorrecto"
---

# `.agent/prompts/bug-fix.md`

## 🎯 Cuándo usarlo

- "El cálculo de impuestos está mal cuando el condominio es exento."
- "Al aprobar un pago sin comprobante, el estado queda como approved."
- "El switch de condominio no refresca los datos en el frontend."

---

## 🚦 Protocolo obligatorio

### Paso 1 — Reproducir

Antes de tocar código:
- ¿Puedo reproducir el bug?
- ¿En qué módulo vive?
- ¿Es de backend, frontend, DB, o interacción?
- ¿Afecta a un solo tenant o a varios?
- ¿Es un caso borde o un flujo principal?

Si no puedes reproducirlo, **pregunta al usuario** por más detalle.

### Paso 2 — Cargar contexto

Lee en este orden:
1. `AGENTS.md`
2. `.agent/context.md`
3. `.agent/coding-standards.md`
4. `docs/11-MODULES/<M0X>.md`
5. `docs/07-BUSINESS-RULES.md` (si aplica a lógica de negocio)
6. `docs/13-TESTING-QA.md`

### Paso 3 — Diagnosticar

Responde:
- ¿Cuál es el comportamiento actual?
- ¿Cuál es el comportamiento esperado?
- ¿Dónde está el código responsable?
- ¿Por qué ocurre? (no solo dónde)
- ¿Hay otros lugares con el mismo patrón? (importante)

### Paso 4 — Plan

Presenta al usuario:
- Bug: <título>
- Módulo: <M0X>
- Comportamiento actual: ...
- Comportamiento esperado: ...
- Causa raíz: ...
- Archivos a modificar: ...
- Tests a agregar: ...
- Riesgos: ...
- ¿Procedo?


Espera aprobación si el fix toca más de 1 archivo o si cambia comportamiento público.

### Paso 5 — Escribir test que reproduce el bug

**Regla de oro:** antes de arreglar, escribe el test que falla.
- Si es bug de dominio → unit test.
- Si es bug de endpoint → integration test.
- Si es bug de UI → E2E.
- Si es bug de datos → test de migración.

El test debe fallar **antes** del fix y pasar **después**.

### Paso 6 — Arreglar

- Arregla la **causa raíz**, no el síntoma.
- Si el mismo bug puede existir en otro lugar, búscalo y arréglalo también.
- Refactoriza si mejora la claridad del fix.
- No introduzcas dependencias nuevas para arreglar un bug.

### Paso 7 — Verificar

- El test nuevo pasa.
- Los tests existentes siguen pasando.
- El bug no reaparece bajo condiciones similares.
- No rompiste ningún contrato público.
- No rompiste aislamiento multi-tenant.

### Paso 8 — Documentar

- Si el bug revela una regla no documentada → actualiza `docs/07`.
- Si el bug revela un caso borde importante → agrégalo a `docs/13`.
- Si el bug revela un problema de diseño → considera un ADR.

### Paso 9 — Checklist

Correr `.agent/pr-checklist.md`.

---

## 🧭 Clasificación de bugs

| Tipo | Señal | Estrategia |
|---|---|---|
| **Lógica de negocio** | Cálculo incorrecto | Test unitario del dominio |
| **Contrato** | Cliente recibe algo distinto | Test de integración del endpoint |
| **Aislamiento** | Datos cruzados | Test multi-tenant + revisar RLS |
| **Estado** | FSM incorrecta | Test de transición + revisar guards |
| **UI** | Render incorrecto | Test E2E + revisar i18n |
| **Performance** | Timeout / lentitud | k6 + revisar índices |
| **Concurrencia** | Race conditions | Test de carga + revisar locks |

---

## 🚫 Errores comunes al arreglar bugs

- Arreglar el síntoma y no la causa.
- No escribir test de reproducción.
- Cambiar comportamiento no solicitado.
- Aprovechar para "refactorizar todo".
- Romper otros tests existentes.
- No avisar al usuario de efectos colaterales.

---

## ✅ Señales de que salió bien

- El test que reproduce el bug falla antes y pasa después.
- Los tests existentes siguen pasando.
- El fix es mínimo y enfocado.
- Hay un test que previene regresión futura.
- La doc refleja el comportamiento correcto.

---

## 📌 Formato de respuesta esperado
Diagnóstico
Bug: <título>
Módulo: <M0X>
Actual: ...
Esperado: ...
Causa raíz: ...
Afecta a: <alcance>

Fix propuesto
Archivos:

<ruta> → <cambio>

<ruta> → <cambio>

Tests agregados:

<ruta> → <qué cubre>

Riesgos: ...

Verificación
□ Test de reproducción falla antes del fix
□ Pasa después del fix
□ Tests existentes siguen pasando
□ Checklist del PR corriendo
¿Procedo con el fix?