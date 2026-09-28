import { setupWorker } from "msw/browser"
import { handlers } from "@/mocks/handlers"

/**
 * Solo se usa en desarrollo (ver main.tsx) mientras no existe backend real.
 * Al conectar la API definitiva basta con dejar de arrancar este worker.
 */
export const worker = setupWorker(...handlers)
