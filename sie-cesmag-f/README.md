# SIE CESMAG — Frontend

Sistema de Información de Emprendimiento de la Coordinación de Emprendimiento de la
Universidad CESMAG. Gestiona el ciclo completo de un emprendimiento: caracterización de
precandidatos, aprobación de cuentas, seguimiento por etapas/fases, asesorías agendables,
entregables con evidencia, notificaciones y un dashboard de indicadores.

Basado en `RF-01..35`, `HU-01..37`, el Diagrama de Casos de Uso (10 módulos / 38 CU), el
Diagrama Entidad-Relación y los wireframes de Figma del proyecto.

## Cómo levantarlo

```bash
pnpm install
pnpm run dev
```

Abre la URL que imprime Vite (por defecto `http://localhost:5173`).

## Cuentas de desarrollo (sin backend todavía)

Mientras no exista una API real, [Mock Service Worker](https://mswjs.io) intercepta las
llamadas en desarrollo con datos de ejemplo (ver `src/mocks/`). Puedes iniciar sesión con:

| Portal | Correo | Contraseña |
|---|---|---|
| Administrativo (Vicerrector / Coordinador / Empleado) | `coordinador@unicesmag.edu.co` | `cesmag123` |
| Emprendedor | `jperez@unicesmag.edu.co` | `cesmag123` |

Estas credenciales también aparecen como recordatorio directamente en la pantalla de Login
mientras el proyecto está en modo desarrollo.

Al conectar el backend real, se retira el arranque del worker en `src/main.tsx` y las
llamadas de `src/domain/*/api.ts` empiezan a golpear la API definitiva (URL configurable
en `VITE_API_URL`, ver `.env.example`).

## Stack

Vite + React + TypeScript estricto · Tailwind CSS v4 (`@theme` en `src/index.css`, sin
`tailwind.config.js`) · shadcn/ui (preset Vega) · Zustand · TanStack Query · React Router ·
React Hook Form + Zod · Axios.

## Estructura de `src/`

- `domain/<entidad>` — tipos, llamadas a la API y hooks de datos compartidos entre ambos
  portales (Emprendimiento, Asesoria, Entregable, Usuario, etc.).
- `portals/admin` y `portals/emprendedor` — layouts, rutas y páginas propias de cada
  experiencia (son shells de navegación completamente separados; nunca se comparten).
- `features/auth` — pantallas públicas de autenticación (Login, recuperar/restablecer
  contraseña).
- `components/ui` — primitivos de shadcn/ui (no editar a mano; ver más abajo cómo añadir).
- `components/shared` — componentes compuestos reutilizables entre módulos.
- `stores` — estado de cliente (Zustand): sesión activa, UI.
- `mocks` — handlers de Mock Service Worker mientras no hay backend.

## Añadir un componente de shadcn/ui

El CLI de shadcn no resuelve el alias `@/*` en este entorno (crea una carpeta `@/` literal
en la raíz). Usa siempre:

```bash
pnpm run ui:add <componente...>   # ej. pnpm run ui:add select checkbox
```

Este script ejecuta el CLI y reubica el resultado a `src/` automáticamente.
