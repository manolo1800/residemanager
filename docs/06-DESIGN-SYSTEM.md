
---

## 🗂️ `docs/06-DESIGN-SYSTEM.md`

```markdown
---
id: 06-DESIGN-SYSTEM
title: Sistema de diseño y personalización visual
version: 1.0
audience: human+agent
last_updated: 2026-10-12
---

# 06 — Design System

> Fuente de verdad visual. Todo componente, página y estado usa tokens definidos aquí.

---

## 🎨 Paleta corporativa

### Colores base

| Rol | Hex | Uso principal |
|---|---|---|
| **Primary** | `#2E6DA4` | Botones primarios, links, acentos |
| **Sidebar** | `#64748B` | Barra lateral, headers secundarios, cards neutras |
| **Background** | `#F1F5F9` | Fondo general de la app |
| **Success** | `#22C55E` | Confirmaciones, pagos aprobados, toast success |
| **Warning** | `#EAB308` | Pendientes, mora próxima, toast warning |
| **Danger** | `#EF4444` | Rechazos, mora vencida, toast error |

### Derivados

| Token | Valor | Uso |
|---|---|---|
| `--color-primary-hover` | `#245580` | Hover de botón primario |
| `--color-primary-active` | `#1D4667` | Active de botón primario |
| `--color-surface` | `#FFFFFF` | Fondos de cards, modales |
| `--color-surface-alt` | `#F8FAFC` | Fondos alternos |
| `--color-text` | `#0F172A` | Texto principal |
| `--color-text-muted` | `#475569` | Texto secundario |
| `--color-text-disabled` | `#94A3B8` | Texto deshabilitado |
| `--color-border` | `#E2E8F0` | Bordes de inputs y separadores |
| `--color-border-strong` | `#CBD5E1` | Bordes de foco |

### Colores semánticos por estado

| Estado | Color | Aplicación |
|---|---|---|
| `pending` | `#EAB308` | Badge, chip |
| `in_review` | `#2E6DA4` | Badge |
| `approved` | `#22C55E` | Badge, check verde |
| `approved_pending_data` | `#EAB308` + ícono ⚠ | Badge especial |
| `rejected` | `#EF4444` | Badge |
| `cancelled` | `#64748B` | Badge gris |
| `paid` | `#22C55E` | Check verde |
| `overdue` | `#EF4444` | Badge rojo |

---

## 🧩 Tokens CSS

Todos los colores se exponen como **CSS variables** en `:root`, y son sobrescribibles por condominio.

```css
:root {
  /* Marca */
  --color-primary: #2E6DA4;
  --color-primary-hover: #245580;
  --color-primary-active: #1D4667;

  /* Estructura */
  --color-sidebar: #64748B;
  --color-background: #F1F5F9;
  --color-surface: #FFFFFF;
  --color-surface-alt: #F8FAFC;

  /* Semánticos */
  --color-success: #22C55E;
  --color-warning: #EAB308;
  --color-danger: #EF4444;

  /* Texto */
  --color-text: #0F172A;
  --color-text-muted: #475569;
  --color-text-disabled: #94A3B8;
  --color-text-inverse: #FFFFFF;

  /* Bordes */
  --color-border: #E2E8F0;
  --color-border-strong: #CBD5E1;

  /* Espaciado */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;

  /* Radios */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  /* Sombras */
  --shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.05);
  --shadow-md: 0 4px 6px rgba(15, 23, 42, 0.07);
  --shadow-lg: 0 10px 15px rgba(15, 23, 42, 0.1);

  /* Tipografía */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --text-xs: 12px;
  --text-sm: 14px;
  --text-base: 16px;
  --text-lg: 18px;
  --text-xl: 20px;
  --text-2xl: 24px;
  --text-3xl: 30px;

  /* Transiciones */
  --transition-fast: 150ms ease;
  --transition-base: 200ms ease;
  --transition-slow: 300ms ease;
}

}
🎨 Personalización por condominio
Cada condominio puede sobrescribir:

Elemento	Cómo
Color primario	condominiums.primary_color
Color del sidebar	condominiums.sidebar_color
Logo	condominiums.logo_url
Favicon	condominiums.favicon_url
Nombre visible	condominiums.name
Aplicación en frontend
tsx
// apps/web/providers/TenantThemeProvider.tsx
export function TenantThemeProvider({ condo, children }) {
  const style = {
    '--color-primary': condo.primaryColor ?? undefined,
    '--color-sidebar': condo.sidebarColor ?? undefined,
  } as React.CSSProperties;

  return (
    <div style={style} className="min-h-screen bg-[var(--color-background)]">
      {children}
    </div>
  );
}
El cambio de condominio reevalúa el theme sin recargar la app.

Validaciones
El color debe pasar contraste WCAG AA contra --color-text-inverse.

Si el admin elige un color con contraste insuficiente, se muestra advertencia.

Fallback al color corporativo si no se configura.

🧱 Componentes base
Todo componente reutilizable vive en packages/ui y sigue estas reglas:

Button
Variante	Uso
primary	Acción principal (--color-primary)
secondary	Acción secundaria (borde)
ghost	Acción terciaria (sin fondo)
danger	Acción destructiva (--color-danger)
success	Confirmación (--color-success)
Tamaños: sm, md, lg.
Estados: default, hover, active, focus, disabled, loading.

Input, Select, Textarea
Borde --color-border.

Focus: --color-border-strong + ring --color-primary.

Error: borde --color-danger.

Disabled: fondo --color-surface-alt.

Table
Header --color-sidebar con texto blanco.

Filas alternas con --color-surface-alt.

Hover: fondo --color-background.

Acciones por fila a la derecha.

Paginación estándar.

Columnas ordenables.

Responsive: transformar a cards en mobile.

Badge / Chip
Colores por estado (ver tabla arriba).

Tamaños: sm, md.

Puede llevar ícono.

approved_pending_data lleva ícono ⚠️ amarillo.

Toast / Notificación
success → verde #22C55E.

warning → amarillo #EAB308.

error → rojo #EF4444.

info → azul #2E6DA4.

Auto-dismiss 5s (excepto error).

Posición: top-right.

Modal
Overlay rgba(15, 23, 42, 0.4).

Ancho máximo 640px.

Cierre con ESC y click fuera.

Foco atrapado dentro.

Botones: secundario izquierda, primario derecha.

Sidebar
Color --color-sidebar.

Ancho 240px expandido / 64px colapsado.

Ítems: ícono + label.

Ítem activo con fondo --color-primary.

Logo del condominio arriba.

Switch de condominio visible.

Avatar + menú de usuario abajo.

StatCard (dashboard)
Fondo --color-surface.

Borde --color-border.

Ícono coloreado según tipo.

Número grande, label pequeño.

🖼️ Layout general
text
┌──────────────────────────────────────────────────────┐
│  Sidebar (#64748B)  │  TopBar (breadcrumbs, user)    │
│                     ├────────────────────────────────┤
│                     │                                │
│                     │  Contenido (bg #F1F5F9)        │
│                     │                                │
│                     │                                │
└─────────────────────┴────────────────────────────────┘
Sidebar fijo a la izquierda.

TopBar pegajoso.

Contenido con padding --space-6.

Breakpoints: mobile < 768px (sidebar drawer).

🎯 Tipografía
Fuente: Inter (Google Fonts o self-hosted).

Jerarquía: H1 --text-3xl, H2 --text-2xl, H3 --text-xl, body --text-base.

Peso: 400 normal, 500 medio, 600 semibold, 700 bold.

Interlineado: 1.5 en body, 1.2 en títulos.

🌗 Modo oscuro
Fuera de alcance v1. Se puede agregar en v2 sin refactor porque los tokens están centralizados.

♿ Accesibilidad
Contraste mínimo AA (4.5:1) en texto.

Foco visible en todos los elementos interactivos.

Aria labels en íconos sin texto.

Navegación por teclado completa.

Sin información solo por color (siempre acompañar con ícono o texto).

🧪 Estados visuales obligatorios
Cada componente interactivo debe contemplar:

Default

Hover

Focus (visible)

Active

Disabled

Loading

Error (si aplica)

Empty (para listas/tablas)

🖼️ Assets
Íconos: lucide-react.

Ilustraciones vacías: custom SVG o undraw.

Logos: del condominio (upload a MinIO).

Favicon: idem.

📌 Reglas de uso de color
Verde solo para éxito y confirmaciones.

Amarillo solo para advertencia y pendientes.

Rojo solo para errores, rechazos y acciones destructivas.

Azul #2E6DA4 para acciones primarias, links, info.

Gris #64748B para neutro, sidebar, cards secundarias.

Nunca usar color como único indicador de estado.

📌 Checklist de PR (diseño)
□ Los componentes nuevos usan tokens (--color-*, --space-*).
□ No hay colores hardcodeados fuera del design system.
□ Los estados hover/focus/disabled están definidos.
□ Los estados vacíos están diseñados.
□ Contraste AA validado.
□ Responsive probado en 3 breakpoints.
□ Aria labels en íconos.
□ Personalización del condominio respetada.
