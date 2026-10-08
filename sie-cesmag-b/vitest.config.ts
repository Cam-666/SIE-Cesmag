import path from "path"
import { defineConfig } from "vitest/config"

/**
 * Configuración de pruebas del backend. Las pruebas NO viven junto al código
 * de producción: están en ../pruebas/backend (ver pruebas/README.md). El
 * alias @/ apunta a src/, igual que ya lo hace el frontend, para que los
 * archivos de prueba (fuera de src/) importen sin rutas relativas largas
 * tipo "../../../sie-cesmag-b/src/...".
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  // Vite solo sirve archivos dentro del proyecto por defecto; pruebas/ vive
  // un nivel arriba (es compartida con el frontend), así que hay que autorizarla.
  server: {
    fs: {
      allow: [path.resolve(import.meta.dirname, "..")],
    },
  },
  test: {
    include: ["../pruebas/backend/**/*.test.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      reportsDirectory: "coverage",
      reporter: ["text", "html", "json-summary", "json"],
    },
  },
})
