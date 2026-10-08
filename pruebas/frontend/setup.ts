import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterAll, afterEach, beforeAll } from "vitest"
import { queryClient } from "@/lib/query-client"
import { useAuthStore } from "@/stores/auth-store"
import { server } from "./msw-server"

// jsdom no implementa matchMedia; sonner (los toasts, montados en AppProviders)
// lo llama al montar. Sin este polyfill, cualquier prueba que renderice la
// aplicación completa falla con "window.matchMedia is not a function".
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList
}

// Arranca/limpia/cierra el servidor MSW alrededor de toda la suite. Una
// petición no interceptada por ningún handler hace fallar la prueba en vez
// de pasar silenciosamente (o peor, salir a la red real).
beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// @testing-library/react limpia el DOM solas entre pruebas SOLO si detecta un
// `afterEach` global (test.globals: true) — a propósito no activamos esa
// opción (ver vitest.config.ts), así que hay que desmontar el árbol de React
// explícitamente, o cada prueba que haga `render(<App />)` se acumula sobre
// el DOM de la anterior.
//
// Cuatro fugas de estado más, entre pruebas del mismo archivo (mismo jsdom):
// la URL de jsdom no vuelve sola a "/", y tanto `queryClient` como
// `useAuthStore` son un único objeto en memoria para todo el archivo — la
// app solo los limpia al cerrar sesión de verdad (`cerrarSesion()`), algo
// que una prueba que solo desmonta <App /> nunca dispara. Limpiar
// sessionStorage NO alcanza: el store de Zustand ya tiene la sesión cargada
// en memoria, no la vuelve a leer del storage en cada render. Sin este
// reseteo, una prueba que inicia sesión como Coordinador deja a la
// siguiente ya "logueada" al volver a renderizar.
afterEach(() => {
  cleanup()
  useAuthStore.setState({ sesion: null })
  sessionStorage.clear()
  localStorage.clear()
  queryClient.clear()
  window.history.pushState(null, "", "/")
})
