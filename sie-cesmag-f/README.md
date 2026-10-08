# SIE CESMAG — Frontend

Sistema de Información de Emprendimiento de la Coordinación de Emprendimiento de la
Universidad CESMAG. Gestiona el ciclo completo de un emprendimiento: caracterización de
precandidatos, aprobación de cuentas, seguimiento por etapas/fases, asesorías agendables,
entregables con evidencia, notificaciones y un dashboard de indicadores.

En producción corre en Vercel: `https://sie-cesmag-f.vercel.app`, consumiendo la API real
de la carpeta `sie-cesmag-b` (desplegada en Railway).

## Cómo levantarlo

```bash
pnpm install
pnpm run dev
```

Abre la URL que imprime Vite (por defecto `http://localhost:5173`).

## Dos formas de desarrollar: con datos de ejemplo o con la API real

Por defecto, en desarrollo [Mock Service Worker](https://mswjs.io) intercepta las llamadas
con datos de ejemplo (ver `src/mocks/`) — útil para trabajar en la UI sin depender de una
base de datos real. Puedes iniciar sesión con:

| Portal | Correo | Contraseña |
|---|---|---|
| Administrativo (Vicerrector / Coordinador / Empleado) | `coordinador@unicesmag.edu.co` | `cesmag123` |
| Emprendedor | `jperez@unicesmag.edu.co` | `cesmag123` |

Estas credenciales también aparecen como recordatorio directamente en la pantalla de Login
mientras el proyecto está en modo desarrollo.

Para apuntar en cambio al backend real (`sie-cesmag-b`), copia `.env.example` a
`.env.local` y ajusta:

```bash
VITE_API_URL=http://localhost:4000/api   # o la URL de Railway en producción
VITE_USE_MOCKS=false
```

## Stack

Vite + React + TypeScript estricto · Tailwind CSS v4 (`@theme` en `src/index.css`, sin
`tailwind.config.js`) · shadcn/ui (preset Vega) · Zustand · TanStack Query · React Router ·
React Hook Form + Zod · Axios.

## Estructura de `src/`

- `domain/<entidad>` — tipos, llamadas a la API y hooks de datos compartidos entre ambos
  portales (Emprendimiento, Asesoria, Entregable, Usuario, Indicadores, Notificacion, etc.).
- `portals/admin` — portal administrativo (Vicerrector, Coordinador, Empleado): dashboard,
  emprendimientos, asesorías, entregables, reportes e indicadores, usuarios y roles.
- `portals/emprendedor` — portal del emprendedor: su emprendimiento, sus entregables, sus
  asesorías, su perfil. Es un shell de navegación completamente separado del admin — nunca
  se comparten layouts ni rutas entre los dos.
- `features/auth` — pantallas públicas de autenticación (Login, recuperar/restablecer
  contraseña), compartidas por ambos portales.
- `components/ui` — primitivos de shadcn/ui (no editar a mano; ver más abajo cómo añadir).
- `components/shared` — componentes compuestos reutilizables entre módulos (calendario,
  ruta metodológica, centro de notificaciones, selector de etiquetas, etc.).
- `stores` — estado de cliente (Zustand): sesión activa, UI.
- `mocks` — handlers de Mock Service Worker para desarrollar sin backend real.

## Módulos del portal admin

| Página | Qué hace |
|---|---|
| Dashboard | Resumen visual: emprendimientos activos, próximas asesorías, entregables recientes. |
| Emprendimientos | Ficha completa por emprendimiento: ruta metodológica, caracterización, integrantes, histórico de asesorías. |
| Asesorías | Agendamiento dentro de la propia disponibilidad, calendario, registro de resultado. |
| Entregables | Asignación y revisión (aprobar/rechazar) con historial de intentos. |
| Reportes e Indicadores | Distribución por etapa, avance por fase, deserción, retención y tiempo de permanencia, con filtro de periodo. |
| Usuarios y Roles | Alta de usuarios administrativos, matriz de permisos por módulo, responsables por etapa. |

Cada página está protegida por `RequirePermiso` (`src/app/guards.tsx`) según el módulo, y
el enlace correspondiente del sidebar se oculta cuando el usuario no tiene el permiso — pero
el guard de ruta es el control real, no el sidebar.

## Añadir un componente de shadcn/ui

El CLI de shadcn no resuelve el alias `@/*` en este entorno (crea una carpeta `@/` literal
en la raíz). Usa siempre:

```bash
pnpm run ui:add <componente...>   # ej. pnpm run ui:add select checkbox
```

Este script ejecuta el CLI y reubica el resultado a `src/` automáticamente.

## Despliegue

Vercel construye con `tsc -b && vite build`. Para publicar un cambio:

```bash
vercel --prod --yes
```

`vercel.json` redirige cualquier ruta a `index.html` (necesario porque es una SPA con rutas
del lado del cliente — sin esto, abrir un enlace profundo como
`/restablecer-password?token=...` directamente da 404). Variables de entorno necesarias en
Vercel: `VITE_API_URL` (apuntando al backend de Railway) y `VITE_USE_MOCKS=false`.
