import { setupServer } from "msw/node"
import { handlers } from "@/mocks/handlers"

/**
 * Servidor MSW para Node (Vitest), distinto del `worker` de navegador que usa
 * `src/mocks/browser.ts` en desarrollo. Reutiliza exactamente los mismos
 * `handlers` — la única fuente de verdad de los datos simulados — así que un
 * endpoint nuevo que se agregue en src/mocks/handlers/ queda disponible aquí
 * sin tocar nada de esta carpeta.
 */
export const server = setupServer(...handlers)
