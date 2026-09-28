# SIE CESMAG — API

Backend en Express para el SIE, con Prisma sobre Supabase Postgres y
Supabase Auth para el login. Ver el historial de la conversación de diseño
para el porqué de cada decisión — este README solo deja los pasos mecánicos.

## Qué hay hasta ahora

- `prisma/schema.prisma` — esquema completo (17 entidades del ER original
  + los ajustes acordados: Supabase Auth, `PermisoRol`, `Etapa.idUsuarioResponsable`,
  caracterización vía vista en vez de columnas, etc.)
- `prisma/sql/vista_caracterizacion.sql` — DDL de la vista que aplana
  `RESPUESTA` para reportes y la edición de caracterización (RF-21).
- `prisma/sql/checks.sql` — restricciones (CHECK) que Prisma no puede
  expresar en `schema.prisma`: fechas coherentes, motivo obligatorio,
  horario válido, etc.
- `prisma/seed.ts` — catálogo base: roles + permisos, las 3 etapas y 12
  fases de la ruta metodológica, y las 26 preguntas del formulario.
- `src/` — servidor de Express. Hasta ahora, el módulo de **autenticación**
  completo (RF-14/RF-24): login, recuperación y restablecimiento de
  contraseña, todos verificados contra una base de datos real. El middleware
  `requiereSesion` valida el token de Supabase Auth en cada request
  protegido y resuelve el perfil (usuario + rol + permisos); `requierePermiso`
  aplica la matriz de RF-15 también en el servidor, no solo en la UI.
  Los demás módulos (usuarios, roles, emprendimientos, entregables,
  asesorías, agenda, notificaciones, reportes) todavía no existen.
- `scripts/crear-primer-admin.ts` — crea la primera cuenta de Coordinador
  (necesaria una sola vez, ver más abajo).

## Puesta en marcha

```bash
pnpm install
cp .env.example .env   # completar con los datos del proyecto de Supabase

pnpm prisma:generate
pnpm prisma:migrate      # crea las tablas a partir de schema.prisma

# aplicar a mano (SQL Editor de Supabase, o `pnpm prisma db execute --file <ruta>`):
#   1. prisma/sql/vista_caracterizacion.sql
#   2. prisma/sql/checks.sql

pnpm prisma:seed         # carga roles, ruta metodológica y preguntas
```

## Levantar el servidor

```bash
pnpm dev   # http://localhost:4000, recarga automática con tsx watch
```

`GET /api/salud` responde `{ ok: true }` si todo arrancó bien.

## Crear la primera cuenta (una sola vez)

RF-13 dice que el coordinador crea a los demás usuarios administrativos,
pero el primero no tiene quién lo cree. Este script la crea directamente
(sin depender de que el envío de correos ya esté configurado):

```bash
pnpm bootstrap:admin correo@unicesmag.edu.co "Nombre Completo" unaContrasenaDeAlMenos8Caracteres
```

De ahí en adelante, esa cuenta puede iniciar sesión normalmente en
`POST /api/auth/login`, y (cuando exista) crear al resto de usuarios desde
el frontend.

## Pendiente de un proveedor de correo real

`solicitarRecuperacion` (RF-24) y, más adelante, la invitación al aprobar un
precandidato (RF-23) generan el enlace correcto pero todavía no lo envían
por correo de verdad — queda registrado en la consola del servidor
(`[TODO: enviar por correo real] ...`) para poder probar el flujo completo
mientras tanto. Antes de que esto sea real para la Unidad, hay que conectar
un proveedor (Resend, SMTP, etc.).
