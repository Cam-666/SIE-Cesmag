/**
 * Casos: CP-CN-077 a CP-CN-080
 * Tipo: Unitaria – Caja negra (componente)
 * Técnica: Particiones de equivalencia, de extremo a extremo en la interfaz
 * (sin inspeccionar el código interno del componente)
 * Trazabilidad: RF-14 (Autenticación de usuarios) / HU-17 (Acceder al
 * sistema según las responsabilidades asignadas).
 * Objetivo: A diferencia de la Fase 2 (que probó las reglas del esquema Zod
 * de forma aislada), esta prueba confirma que esas reglas quedan realmente
 * conectadas a la pantalla: que los mensajes de validación aparecen en el
 * DOM cuando la persona usuaria interactúa con el formulario real, que una
 * contraseña incorrecta muestra el aviso correspondiente, y que una cuenta
 * válida termina en el portal que le corresponde a su rol — distinto entre
 * el ámbito admin (Coordinador) y el ámbito emprendedor.
 */
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import App from "@/app/App"
import { CUENTAS, iniciarSesion } from "../ayudas"

describe("Formulario de inicio de sesión (RF-14/HU-17)", () => {
  it("CP-CN-077 — enviar el formulario vacío muestra los dos mensajes de validación en pantalla", async () => {
    render(<App />)
    await iniciarSesion("", "")

    expect(await screen.findByText("Ingresa tu correo institucional.")).toBeInTheDocument()
    expect(screen.getByText("Ingresa tu contraseña.")).toBeInTheDocument()
  })

  it("CP-CN-078 — una contraseña incorrecta muestra el aviso y no navega fuera de /login", async () => {
    render(<App />)
    await iniciarSesion(CUENTAS.coordinador.correo, "contrasena-equivocada")

    expect(await screen.findByText("Correo o contraseña incorrectos.")).toBeInTheDocument()
    expect(screen.getByLabelText("Correo institucional")).toBeInTheDocument()
  })

  it("CP-CN-079 — el Coordinador entra al portal administrativo", async () => {
    render(<App />)
    await iniciarSesion(CUENTAS.coordinador.correo, CUENTAS.coordinador.contrasena)

    expect(await screen.findByRole("link", { name: "Usuarios y Roles" })).toBeInTheDocument()
  })

  it("CP-CN-080 — el Emprendedor entra a su propio portal, no al administrativo", async () => {
    render(<App />)
    await iniciarSesion(CUENTAS.emprendedor.correo, CUENTAS.emprendedor.contrasena)

    expect(await screen.findByRole("link", { name: "Mis entregables" })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Usuarios y Roles" })).not.toBeInTheDocument()
  })
})
