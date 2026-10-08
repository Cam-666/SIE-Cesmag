import path from "path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

/**
 * Configuración de pruebas del frontend. Las pruebas NO viven junto al
 * código de producción: están en ../pruebas/frontend (ver pruebas/README.md).
 * environment "jsdom" porque tanto los esquemas/utilidades (caja negra de
 * Fase 2) como los componentes (caja negra de Fase 3) corren bajo el mismo
 * proyecto de Vitest; setupFiles arranca el servidor MSW de Node (reutiliza
 * los handlers de src/mocks/, no los duplica) y los matchers de jest-dom.
 */

/**
 * Como pruebas/frontend vive un nivel arriba de este proyecto, no tiene un
 * node_modules ancestro en común con sie-cesmag-f — Vite no encuentra ahí
 * paquetes como "@testing-library/react" solo con `server.fs.allow`. En vez
 * de instalarlos por duplicado en otra carpeta (eso daría dos copias de
 * React y errores de "Invalid hook call"), se resuelven aquí mismo — dentro
 * de sie-cesmag-f, donde sí existen — con la resolución real de Node, y esa
 * ruta exacta se le pasa a Vite como alias.
 */
function resolverDesdeEsteProyecto(especificador: string): string {
  return fileURLToPath(import.meta.resolve(especificador))
}

export default defineConfig({
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(import.meta.dirname, "./src") },
      // Las entradas con subruta (".../vitest", ".../node") van antes que su
      // paquete "general": Vite usa la primera coincidencia de la lista.
      { find: "@testing-library/jest-dom/vitest", replacement: resolverDesdeEsteProyecto("@testing-library/jest-dom/vitest") },
      { find: "@testing-library/jest-dom", replacement: resolverDesdeEsteProyecto("@testing-library/jest-dom") },
      { find: "@testing-library/react", replacement: resolverDesdeEsteProyecto("@testing-library/react") },
      { find: "@testing-library/user-event", replacement: resolverDesdeEsteProyecto("@testing-library/user-event") },
      { find: "msw/node", replacement: resolverDesdeEsteProyecto("msw/node") },
      { find: "msw", replacement: resolverDesdeEsteProyecto("msw") },
      // El plugin de JSX inyecta este import en todo archivo .tsx de prueba,
      // incluidos los de pruebas/frontend — mismo problema, para React.
      { find: "react/jsx-dev-runtime", replacement: resolverDesdeEsteProyecto("react/jsx-dev-runtime") },
      { find: "react/jsx-runtime", replacement: resolverDesdeEsteProyecto("react/jsx-runtime") },
      { find: "react-dom/client", replacement: resolverDesdeEsteProyecto("react-dom/client") },
      { find: "react-dom", replacement: resolverDesdeEsteProyecto("react-dom") },
      { find: "react", replacement: resolverDesdeEsteProyecto("react") },
    ],
  },
  // Vite solo sirve archivos dentro del proyecto por defecto; pruebas/ vive
  // un nivel arriba (es compartida con el backend), así que hay que autorizarla.
  server: {
    fs: {
      allow: [path.resolve(import.meta.dirname, "..")],
    },
  },
  test: {
    include: ["../pruebas/frontend/**/*.test.{ts,tsx}"],
    environment: "jsdom",
    // Nota: Vitest sugiere `pool: "vmThreads"` cuando ve "environment jsdom
    // created N times" (una advertencia de rendimiento, no un error). Se
    // probó y se revirtió a propósito: ese pool no expone `TransformStream`
    // y otras globales web que `@mswjs/interceptors` necesita, y rompe MSW.
    // La velocidad actual (~90 pruebas en bajo 30 s) es aceptable tal cual.
    setupFiles: ["../pruebas/frontend/setup.ts"],
    // .env.local puede tener VITE_USE_MOCKS=false y VITE_API_URL apuntando a
    // la API real de producción (así quedó documentado para Playwright en su
    // momento) — se fuerza aquí para que las pruebas de componentes que
    // inician sesión de verdad siempre hablen con los handlers de MSW
    // (rutas relativas), nunca con la API real.
    env: {
      VITE_USE_MOCKS: "true",
      VITE_API_URL: "/api",
    },
    // Las pruebas de componentes de la Fase 3 inician sesión de verdad y
    // navegan por la app real (varias idas y vueltas con MSW); con la
    // instrumentación de cobertura activada esa sobrecarga real empuja a
    // algunas por encima del límite por defecto de 5 s.
    testTimeout: 15_000,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      reportsDirectory: "coverage",
      reporter: ["text", "html", "json-summary"],
    },
  },
})
