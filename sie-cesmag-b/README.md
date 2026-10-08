# SIE CESMAG — API

Backend en Express para el SIE (Sistema de Información de Emprendimiento) de la
Coordinación de Emprendimiento de la Universidad CESMAG. Expone toda la lógica
de negocio sobre Prisma + Supabase Postgres, con Supabase Auth para el login.

En producción corre en Railway: `https://sie-cesmag-api-production.up.railway.app`.
El frontend (repositorio `sie-cesmag-f`) corre por separado en Vercel y consume
esta API por HTTP.

## Módulos

Todos bajo `/api`, protegidos por `requiereSesion` (valida el token de
Supabase Auth) salvo donde se indica. `requierePermiso` aplica la matriz de
roles y permisos (RF-15) también en el servidor, no solo en la UI.

| Módulo | Ruta base | Qué hace |
|---|---|---|
| `auth` | `/auth` | Login, recuperación y restablecimiento de contraseña (RF-14/RF-24). Sin sesión previa. |
| `formulario` (público) | `/formulario/respuestas` | Recibe las respuestas del formulario de Google (RF-01). Protegido por una clave compartida (`FORMULARIO_CLAVE_SECRETA`), no por sesión. |
| `formulario` | `/precandidatos` | Revisión y aprobación de precandidatos, con creación automática de la cuenta de emprendedor (RF-23). |
| `usuarios-roles` | `/usuarios`, `/roles` | Alta de usuarios administrativos, gestión de roles y permisos (RF-13/RF-15), asignación de responsables por etapa (RF-16). |
| `emprendimientos` | `/emprendimientos` | Ficha completa, diagnóstico inicial y etapa de ingreso (RF-07), cambios de estado y reingreso (RF-06/RF-08), edición de caracterización (RF-21), integrantes (RF-22), avance de fase (RF-05). |
| `agenda` | `/agenda` | Disponibilidad semanal configurable por cualquier usuario administrativo (RF-29). |
| `asesorias` | `/asesorias` | Registro y agendamiento de asesorías (RF-02/RF-30), cancelación/reprogramación (RF-32), notificación de agendamiento (RF-31). |
| `entregables` | `/entregables` | Asignación de entregables (RF-03), revisión con historial de intentos (RF-04/RF-35). La evidencia se almacena en Google Drive (ver abajo). |
| `notificaciones` | `/notificaciones` | Centro de notificaciones del usuario autenticado. |
| `indicadores` | `/indicadores`, `/dashboard` | Dashboard y Reportes e Indicadores: resumen general, distribución por etapa, deserción, tiempo de permanencia (RF-17 a RF-20). |
| `mi` | `/mi/*` | Todo el portal del emprendedor: su emprendimiento, sus asesorías, sus entregables, su perfil, su dashboard (RF-25 a RF-28). |

## Tareas programadas

`src/server.ts` arranca un cron (`node-cron`) que corre una vez al día, 7:00
a. m. hora Colombia, y genera automáticamente:

- Recordatorio de asesoría un día antes (RF-33).
- Recordatorio de entregable un día antes de vencer (RF-34).
- Aviso de inactividad — por correo y en la plataforma — a emprendimientos
  activos sin actividad en los últimos 15 días (RF-11/RF-12).

Cada verificación corre en su propio `try/catch` (ver
`src/modules/notificaciones/tareasProgramadas.service.ts`): que una falle no
bloquea a las otras dos.

## Evidencias de entregables en Google Drive

El archivo que sube el emprendedor nunca toca el navegador hacia afuera: viaja
como `multipart/form-data` a `POST /mi/entregables/:id/evidencia`, el backend
lo recibe en memoria (`multer`, sin tocar disco) y lo reenvía a la cuenta
institucional `unidademprendimiento2026@gmail.com` vía la API de Google Drive
(`src/lib/googleDrive.ts`), organizado como:

```
Entregables SIE CESMAG / <emprendimiento> / <etapa> / <fase> / archivo
```

Autenticación por OAuth2 con refresh token (esa cuenta no es de Google
Workspace, así que no hay cuenta de servicio con delegación de dominio).
`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` salen de Google Cloud Console →
Credenciales → ID de cliente OAuth ("Aplicación de escritorio");
`GOOGLE_REFRESH_TOKEN` se obtiene una sola vez con
`pnpm exec tsx scripts/obtener-refresh-token-drive.ts` (instrucciones dentro
del script). `IntentoEntrega.rutaEvidencia` guarda el ID del archivo en
Drive, no una URL — el enlace de vista (`.../file/d/<id>/view`) se arma al
vuelo, igual que antes se firmaba una URL de Supabase Storage bajo demanda.

## Correo real

El envío de correo (bienvenida al aprobar un precandidato, restablecimiento
de contraseña, agendamiento/cancelación de asesorías, recordatorios de
inactividad) usa la API HTTP de Brevo (`src/lib/correo.ts`) — no SMTP, porque
Railway bloquea las conexiones salientes por esos puertos. Para migrarlo a
otra cuenta (p. ej. la institucional cuando esté disponible), basta con
cambiar `BREVO_API_KEY`/`BREVO_REMITENTE` en las variables de entorno; nada
del código cambia.

## Puesta en marcha (desarrollo local)

```bash
pnpm install
cp .env.example .env   # completar con los datos del proyecto de Supabase y de Brevo

pnpm prisma:generate
pnpm prisma:migrate      # crea las tablas a partir de schema.prisma

# aplicar a mano (SQL Editor de Supabase, o `pnpm prisma db execute --file <ruta>`),
# en este orden porque cada uno depende del anterior:
#   1. prisma/sql/vista_caracterizacion_formulario.sql
#   2. prisma/sql/vista_caracterizacion.sql
#   3. prisma/sql/checks.sql

pnpm prisma:seed         # carga roles, ruta metodológica (3 etapas / 12 fases) y preguntas
```

## Levantar el servidor

```bash
pnpm dev   # http://localhost:4000, recarga automática con tsx watch
```

`GET /api/salud` responde `{ ok: true }` si todo arrancó bien.

## Crear la primera cuenta (una sola vez)

RF-13 dice que el coordinador crea a los demás usuarios administrativos,
pero el primero no tiene quién lo cree. Este script la crea directamente:

```bash
pnpm bootstrap:admin correo@unicesmag.edu.co "Nombre Completo" unaContrasenaDeAlMenos8Caracteres
```

De ahí en adelante, esa cuenta inicia sesión normalmente y crea al resto de
usuarios desde el frontend.

## Despliegue

Railway despliega directamente el código fuente (`tsx src/server.ts`, sin
paso de build compilado). Para publicar un cambio:

```bash
railway up --detach
```

Variables de entorno necesarias en Railway (ver `.env.example` para el
detalle de cada una): `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, `FRONTEND_URL`, `FORMULARIO_CLAVE_SECRETA`,
`BREVO_API_KEY`, `BREVO_REMITENTE`, `GOOGLE_CLIENT_ID`,
`GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`.

## Integración con Google Forms

`integraciones/google-forms/Codigo.gs` es el script de Apps Script que se
pega en el formulario de caracterización de Google — envía cada respuesta a
`POST /api/formulario/respuestas` con la clave compartida en el encabezado
`X-Formulario-Clave`. Ver los comentarios de ese archivo para los pasos de
instalación en un formulario nuevo.
