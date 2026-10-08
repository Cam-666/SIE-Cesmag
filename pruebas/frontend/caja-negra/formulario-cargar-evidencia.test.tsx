/**
 * Casos: CP-CN-089 a CP-CN-090
 * Tipo: Unitaria – Caja negra (componente)
 * Técnica: Particiones de equivalencia
 * Trazabilidad: RF-28 (Consulta y carga de entregables por el emprendedor) /
 * HU-25 (Consultar y cargar mis entregables).
 * Objetivo: Confirmar que las reglas de `cargarEvidenciaSchema` (ya
 * probadas de forma aislada en la Fase 2) quedan conectadas a la pantalla
 * real del portal del emprendedor: sin archivo seleccionado y con un
 * archivo de extensión no permitida, el mensaje correspondiente aparece
 * visible en el diálogo "Entregar actividad".
 */
import { describe, expect, it } from "vitest"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import App from "@/app/App"
import { CUENTAS, iniciarSesion } from "../ayudas"

describe("Cargar evidencia de un entregable (RF-28/HU-25)", () => {
  it("CP-CN-089 — enviar sin seleccionar archivo muestra el mensaje de obligatoriedad", async () => {
    render(<App />)
    await iniciarSesion(CUENTAS.emprendedor.correo, CUENTAS.emprendedor.contrasena)
    await screen.findByRole("link", { name: "Mis entregables" })

    const usuario = userEvent.setup()
    await usuario.click(screen.getByRole("link", { name: "Mis entregables" }))
    // "Prototipo de baja fidelidad" está pendiente y sin intentos: el formulario de entrega está abierto.
    const fila = await screen.findByRole("row", { name: /Prototipo de baja fidelidad/ })
    await usuario.click(within(fila).getByRole("button", { name: "Ver" }))

    const dialogo = within(await screen.findByRole("dialog"))
    // El diálogo muestra un esqueleto de carga mientras llega el detalle del
    // entregable; hay que esperar a que el botón real aparezca.
    await usuario.click(await dialogo.findByRole("button", { name: "Enviar entrega" }))

    expect(await dialogo.findByText("Seleccione un archivo para entregar.")).toBeInTheDocument()
  })

  it("CP-CN-090 — un archivo con extensión no permitida muestra 'Formato no permitido'", async () => {
    render(<App />)
    await iniciarSesion(CUENTAS.emprendedor.correo, CUENTAS.emprendedor.contrasena)
    await screen.findByRole("link", { name: "Mis entregables" })

    // { applyAccept: false }: por defecto user-event simula el filtro del
    // selector de archivos real del sistema operativo y descarta un archivo
    // que no calce con el atributo `accept` del input, antes incluso de que
    // React se entere — nunca llegaría a seleccionarse. Acá se prueba a
    // propósito el caso en el que ese filtro del navegador no bastara (otro
    // sistema operativo, o alguien arrastrando el archivo igual): que el
    // esquema Zod lo rechace como una segunda barrera, que es justo lo que
    // ya documenta `cargarEvidenciaSchema` en la Fase 2.
    const usuario = userEvent.setup({ applyAccept: false })
    await usuario.click(screen.getByRole("link", { name: "Mis entregables" }))
    const fila = await screen.findByRole("row", { name: /Prototipo de baja fidelidad/ })
    await usuario.click(within(fila).getByRole("button", { name: "Ver" }))

    const dialogo = within(await screen.findByRole("dialog"))
    const archivo = new File(["contenido"], "programa.exe", { type: "application/octet-stream" })
    await usuario.upload(await dialogo.findByLabelText("Archivo de evidencia"), archivo)
    expect(await dialogo.findByText("programa.exe")).toBeInTheDocument()
    await usuario.click(dialogo.getByRole("button", { name: "Enviar entrega" }))

    expect(await dialogo.findByText(/Formato no permitido/)).toBeInTheDocument()
  })
})
