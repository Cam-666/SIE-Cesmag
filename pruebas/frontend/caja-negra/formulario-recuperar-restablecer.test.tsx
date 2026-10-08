/**
 * Casos: CP-CN-081 a CP-CN-086
 * Tipo: Unitaria – Caja negra (componente)
 * Técnica: Particiones de equivalencia + valores límite
 * Trazabilidad: RF-24 (Recuperación de contraseña) / HU-20 (Recuperar el
 * acceso mediante restablecimiento de contraseña).
 * Objetivo: Confirmar que las reglas de `solicitudRecuperacionSchema` y
 * `restablecimientoSchema` (ya probadas de forma aislada en la Fase 2) están
 * conectadas a la pantalla real, y que las dos pantallas públicas del flujo
 * de recuperación se comportan como las vería la persona usuaria: sin un
 * token en el enlace no se puede continuar, y con un token válido el envío
 * exitoso confirma el cambio en pantalla.
 */
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import App from "@/app/App"

function irA(ruta: string) {
  window.history.pushState(null, "", ruta)
  render(<App />)
}

describe("Recuperar contraseña (RF-24/HU-20)", () => {
  it("CP-CN-081 — correo con formato inválido muestra el mensaje en pantalla", async () => {
    irA("/recuperar-password")
    const usuario = userEvent.setup()

    await usuario.type(screen.getByLabelText("Correo registrado"), "no-es-correo")
    await usuario.click(screen.getByRole("button", { name: /enlace/i }))

    expect(await screen.findByText("Ingresa un correo válido.")).toBeInTheDocument()
  })

  it("CP-CN-082 — correo válido muestra la confirmación de envío", async () => {
    irA("/recuperar-password")
    const usuario = userEvent.setup()

    await usuario.type(screen.getByLabelText("Correo registrado"), "alguien@unicesmag.edu.co")
    await usuario.click(screen.getByRole("button", { name: /enlace/i }))

    expect(await screen.findByText(/Si el correo está registrado/)).toBeInTheDocument()
  })
})

describe("Restablecer contraseña (RF-24/HU-20)", () => {
  it("CP-CN-083 — sin token en el enlace: 'Enlace no válido', sin formulario que llenar", async () => {
    irA("/restablecer-password")

    expect(await screen.findByText("Enlace no válido")).toBeInTheDocument()
    expect(screen.queryByLabelText("Nueva contraseña")).not.toBeInTheDocument()
  })

  it("CP-CN-084 — con token, las contraseñas que no coinciden muestran el mensaje", async () => {
    irA("/restablecer-password?token=enlace-de-prueba")
    const usuario = userEvent.setup()

    await usuario.type(screen.getByLabelText("Nueva contraseña"), "cesmag2026")
    await usuario.type(screen.getByLabelText("Confirmar contraseña"), "cesmag2027")
    await usuario.click(screen.getByRole("button", { name: "Guardar nueva contraseña" }))

    expect(await screen.findByText("Las contraseñas no coinciden.")).toBeInTheDocument()
  })

  it("CP-CN-085 — valor límite: 7 caracteres (inválido) impide continuar", async () => {
    irA("/restablecer-password?token=enlace-de-prueba")
    const usuario = userEvent.setup()

    await usuario.type(screen.getByLabelText("Nueva contraseña"), "cesmag2")
    await usuario.type(screen.getByLabelText("Confirmar contraseña"), "cesmag2")
    await usuario.click(screen.getByRole("button", { name: "Guardar nueva contraseña" }))

    expect(await screen.findByText("La contraseña debe tener al menos 8 caracteres.")).toBeInTheDocument()
  })

  it("CP-CN-086 — datos válidos: confirma el cambio en pantalla", async () => {
    irA("/restablecer-password?token=enlace-de-prueba")
    const usuario = userEvent.setup()

    await usuario.type(screen.getByLabelText("Nueva contraseña"), "cesmag2026")
    await usuario.type(screen.getByLabelText("Confirmar contraseña"), "cesmag2026")
    await usuario.click(screen.getByRole("button", { name: "Guardar nueva contraseña" }))

    expect(await screen.findByText("Su contraseña se actualizó correctamente.")).toBeInTheDocument()
  })
})
