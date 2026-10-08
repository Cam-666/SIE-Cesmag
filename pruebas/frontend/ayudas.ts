import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

/** Cuentas demo reales del proyecto (src/mocks/handlers/auth.ts). */
export const CUENTAS = {
  coordinador: { correo: "coordinador@unicesmag.edu.co", contrasena: "cesmag123" },
  administrativo: { correo: "mlopez@unicesmag.edu.co", contrasena: "cesmag123" },
  emprendedor: { correo: "jperez@unicesmag.edu.co", contrasena: "cesmag123" },
} as const

/**
 * Llena y envía el formulario real de login (asume que ya se renderizó la
 * app y está en /login). Quien llama decide cómo confirmar que la
 * navegación terminó (con `findBy*`, que ya espera) — así cada prueba puede
 * esperar la pantalla de destino que le corresponda a su rol.
 */
export async function iniciarSesion(correo: string, contrasena: string) {
  const usuario = userEvent.setup()
  // user-event no acepta "" en .type() (su parser espera una secuencia de
  // teclas, no "ninguna"): un campo vacío simplemente no se toca.
  if (correo) await usuario.type(screen.getByLabelText("Correo institucional"), correo)
  if (contrasena) await usuario.type(screen.getByLabelText("Contraseña", { exact: true }), contrasena)
  await usuario.click(screen.getByRole("button", { name: "Iniciar sesión →" }))
  return usuario
}
