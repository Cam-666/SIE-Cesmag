/**
 * Casos: CP-CN-087 a CP-CN-088
 * Tipo: Unitaria – Caja negra (componente) — de regresión
 * Técnica: Particiones de equivalencia
 * Trazabilidad: RF-03 (Registro de actividades, entregables y evidencias) /
 * HU-07 (Registrar actividades y entregables asignados a un emprendimiento).
 * Objetivo: Confirmar que el diálogo "Nuevo entregable" del portal
 * administrativo muestra los 5 mensajes de validación en español al
 * enviarlo vacío. Es una prueba de regresión a propósito: antes de esta
 * suite se encontró y corrigió un defecto real — el formulario no declaraba
 * `defaultValues`, así que en los campos de selección Zod mostraba "Invalid
 * input: expected string, received undefined" en vez del mensaje en español
 * del esquema (ver `NuevoEntregableDialog.tsx`). Esta prueba queda como
 * guardia para que ese defecto no vuelva a aparecer sin que algo lo note.
 */
import { describe, expect, it } from "vitest"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import App from "@/app/App"
import { CUENTAS, iniciarSesion } from "../ayudas"

describe("Nuevo entregable (RF-03/HU-07)", () => {
  it("CP-CN-087 — guardar vacío muestra los 5 mensajes en español, no el error crudo de Zod", async () => {
    render(<App />)
    await iniciarSesion(CUENTAS.coordinador.correo, CUENTAS.coordinador.contrasena)
    await screen.findByRole("link", { name: "Usuarios y Roles" })

    const usuario = userEvent.setup()
    await usuario.click(await screen.findByRole("link", { name: "Entregables" }))
    await usuario.click(await screen.findByRole("button", { name: "Nuevo entregable" }))

    const dialogo = within(await screen.findByRole("dialog", { name: "Nuevo entregable" }))
    await usuario.click(dialogo.getByRole("button", { name: "Guardar" }))

    expect(await dialogo.findByText("Seleccione un emprendimiento.")).toBeInTheDocument()
    expect(dialogo.getByText("Seleccione la fase.")).toBeInTheDocument()
    expect(dialogo.getByText("Ingrese el título.")).toBeInTheDocument()
    expect(dialogo.getByText("Ingrese la descripción.")).toBeInTheDocument()
    expect(dialogo.getByText("Seleccione la fecha prevista.")).toBeInTheDocument()
    // La regresión concreta: ese mensaje crudo de Zod no debe volver a aparecer.
    expect(dialogo.queryByText(/Invalid input/)).not.toBeInTheDocument()
  })

  it("CP-CN-088 — el selector de fase permanece deshabilitado hasta elegir un emprendimiento", async () => {
    render(<App />)
    await iniciarSesion(CUENTAS.coordinador.correo, CUENTAS.coordinador.contrasena)
    await screen.findByRole("link", { name: "Usuarios y Roles" })

    const usuario = userEvent.setup()
    await usuario.click(await screen.findByRole("link", { name: "Entregables" }))
    await usuario.click(await screen.findByRole("button", { name: "Nuevo entregable" }))

    const dialogo = within(await screen.findByRole("dialog", { name: "Nuevo entregable" }))
    expect(dialogo.getByRole("combobox", { name: /Fase|Seleccione primero/ })).toBeDisabled()
  })
})
