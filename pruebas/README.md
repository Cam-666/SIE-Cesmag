# Pruebas — SIE CESMAG

Suite de pruebas del Sistema de Información de Emprendimiento, separada por completo del
código de producción (`sie-cesmag-f/src` y `sie-cesmag-b/src` no se modifican). Este
documento explica la estructura, cómo se conectó Vitest a cada proyecto y cómo ejecutar
cada tipo de prueba.

## Estructura

```
pruebas/
├── README.md                    ← este archivo
├── frontend/
│   ├── tsconfig.json             (solo editor — ver "Configuración de TypeScript")
│   ├── setup.ts                  (arranque de MSW + jest-dom + polyfill de matchMedia)
│   ├── msw-server.ts             (servidor MSW de Node, reutiliza src/mocks/handlers)
│   ├── caja-negra/               (Fases 2 y 3: esquemas, utilidades, componentes, rutas por rol)
│   └── caja-blanca/              (Fase 5: funciones con lógica condicional)
├── backend/
│   ├── tsconfig.json             (solo editor)
│   ├── caja-negra/               (Fase 4: endpoints — entradas válidas/inválidas/no autorizadas)
│   └── caja-blanca/               (Fase 5)
└── mocks/                        (dobles de prueba compartidos que no son específicos de un caso)

docs-contexto/                    (Fase 7: insumos para los manuales — arquitectura, instalación, funcionalidades)
```

No hay carpeta `informes/`: en vez de mantener varios documentos vivos (bitácora, matriz de
casos, defectos, resultados, análisis de caja blanca) en paralelo a las pruebas, esa
información se compila al final en un único archivo `.md`, a pedido del usuario, pensado
para pasarlo a Claude web. La fuente de verdad mientras tanto es el propio código de
prueba: cada archivo lleva en su cabecera los casos que cubre, la técnica y la
trazabilidad RF/HU (ver "Convenciones" más abajo), y el reporte de cobertura se genera
bajo demanda con `pnpm run test:coverage` (sale a `coverage/` en cada proyecto, sin
versionar — se regenera cuando se necesita).

## Cómo se conectó Vitest (frontend y backend)

Cada proyecto (`sie-cesmag-f`, `sie-cesmag-b`) tiene su propio `vitest.config.ts` en su
raíz — **no** se creó un único runner compartido, porque son dos proyectos de Node
independientes con su propio `package.json` y su propio árbol de dependencias. Cada
configuración apunta hacia afuera, a esta carpeta:

```ts
test: {
  include: ["../pruebas/<frontend|backend>/**/*.test.{ts,tsx}"],
  ...
}
```

Tres ajustes fueron necesarios para que esto funcionara, y se documentan aquí porque no
son obvios a partir del código:

1. **`server.fs.allow`** — Vite, por defecto, solo sirve archivos dentro de la carpeta del
   proyecto. Como `pruebas/` vive un nivel arriba (es compartida entre los dos proyectos),
   hubo que autorizar explícitamente esa carpeta en ambos `vitest.config.ts`.

2. **Alias `@/`** — en el frontend ya apuntaba a `./src` (se reutilizó tal cual); se agregó
   el mismo alias en el backend (que no lo tenía) para que los archivos de prueba importen
   `@/app.js`, `@/lib/...` en vez de rutas relativas largas (`../../../sie-cesmag-b/src/...`).

3. **Alias a paquetes de `node_modules`** (solo frontend) — como `pruebas/frontend/` está
   fuera de `sie-cesmag-f/`, no comparte ningún `node_modules` ancestro con ese proyecto, y
   Vite no encontraba paquetes como `@testing-library/react` o `react` al importarlos desde
   ahí. La solución **no** fue instalar una segunda copia de esos paquetes en otro lugar —
   eso habría dado dos copias de React y errores de "Invalid hook call" al renderizar
   componentes. En su lugar, `sie-cesmag-f/vitest.config.ts` resuelve cada paquete **desde
   dentro del propio proyecto** con la resolución real de Node (`import.meta.resolve`) y le
   pasa esa ruta exacta a Vite como alias. Así, cualquier archivo de prueba usa siempre la
   misma copia de React/Testing Library que ya tiene instalada `sie-cesmag-f`. El backend no
   necesitó este ajuste: Vitest, en `environment: "node"`, resuelve los paquetes de forma
   distinta y no tuvo el mismo problema.

4. **`pruebas/frontend/setup.ts`** agrega también un polyfill de `window.matchMedia`
   (`jsdom` no lo implementa) porque `sonner`, la librería de notificaciones toast que usa
   la aplicación, lo llama al montarse — sin el polyfill, cualquier prueba que renderice la
   aplicación completa falla al instante.

5. **`pruebas/frontend/tsconfig.json`** y **`pruebas/backend/tsconfig.json`** son solo para
   que el editor resuelva tipos e imports dentro de esta carpeta (`noEmit`, no los usa
   ningún script de build ni de prueba — eso lo gobierna cada `vitest.config.ts`). Cada uno
   define su propio alias `@/*` apuntando al `src/` del proyecto correspondiente.

## Mocks: Prisma, Supabase y la API del frontend

- **Backend:** cada prueba reemplaza `@/lib/prisma.js` y `@/lib/supabase.js` con dobles de
  prueba (`vi.mock`). **Ninguna prueba toca la base de datos real ni Supabase real.**
  `vitest-mock-extended` (`mockDeep<PrismaClient>()`) se usa para simular el cliente de
  Prisma con tipado completo en las pruebas de servicios (Fase 4) — requiere que el cliente
  esté generado (`pnpm --dir sie-cesmag-b exec prisma generate`, que solo lee el esquema y
  no se conecta a ninguna base de datos).
- **Frontend:** se reutilizan los handlers de `src/mocks/handlers/` (Mock Service Worker),
  ya que el proyecto los mantiene al día con cada endpoint real para el modo de desarrollo.
  `pruebas/frontend/msw-server.ts` arma un servidor de **Node** (`msw/node`) con esos mismos
  handlers — no se duplican ni se reescriben — y `setup.ts` lo arranca/limpia/cierra
  alrededor de toda la suite. Una petición que no calce con ningún handler hace fallar la
  prueba (`onUnhandledRequest: "error"`), en vez de pasar en silencio o salir a la red real.

## Cómo ejecutar las pruebas

Desde `sie-cesmag-f/`:

| Comando | Qué hace |
|---|---|
| `pnpm run test` | Corre todas las pruebas del frontend una vez. |
| `pnpm run test:watch` | Modo observación. |
| `pnpm run test:coverage` | Corre las pruebas con cobertura; exporta el HTML a `coverage/` (sin versionar). |

Desde `sie-cesmag-b/`:

| Comando | Qué hace |
|---|---|
| `pnpm run test` | Corre todas las pruebas del backend una vez. |
| `pnpm run test:watch` | Modo observación. |
| `pnpm run test:coverage` | Corre las pruebas con cobertura; exporta el HTML a `coverage/` (sin versionar). |

No hay un comando único que corra ambos a la vez todavía — se agregará si hace falta más
adelante; por ahora cada proyecto se prueba desde su propia carpeta, igual que ya corre su
propio `dev`/`build`/`lint`.

## Convenciones de los casos de prueba

- IDs: `CP-CN-001...` (caja negra) y `CP-CB-001...` (caja blanca), consecutivos dentro de
  cada tipo, sin reiniciar por módulo.
- Cada archivo de prueba inicia con el comentario de cabecera (casos que cubre, tipo,
  técnica, trazabilidad RF/HU, objetivo).
- Cada `it(...)` incluye el ID del caso en su descripción, en español.
- La trazabilidad RF/HU se toma de los documentos oficiales
  (`Desktop/EMPRENDIMIENTO/REQUISITOS_VERSION_CORREGIDA_FINAL.docx` y
  `HISTORIAS_DE_USUARIO_VERSION_CORREGIDA_FINAL.docx`), no de los comentarios sueltos que
  ya existían en el código (esos son un resto de una auditoría anterior, incompleto).
