/**
 * Casos: CP-CN-001
 * Tipo: Unitaria – Caja negra (prueba de infraestructura)
 * Técnica: Humo (smoke test)
 * Trazabilidad: N/A — valida que el entorno de pruebas del frontend está operativo;
 * no corresponde a un requisito funcional puntual.
 * Objetivo: Confirmar que la aplicación completa (providers de React Query/tema,
 * enrutador y guardas de ruta) monta sin errores y, sin sesión iniciada, muestra
 * la pantalla de inicio de sesión — igual que vería la persona usuaria real.
 */
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import App from "@/app/App"

describe("Prueba de humo del frontend", () => {
  it("CP-CN-001 — sin sesión, la aplicación muestra la pantalla de inicio de sesión", async () => {
    render(<App />)

    expect(await screen.findByText("Iniciar sesión")).toBeInTheDocument()
    expect(screen.getByLabelText("Correo institucional")).toBeInTheDocument()
  })
})
