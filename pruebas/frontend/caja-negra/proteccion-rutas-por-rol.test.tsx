/**
 * Casos: CP-CN-091 a CP-CN-097
 * Tipo: Unitaria – Caja negra (componente)
 * Técnica: Particiones de equivalencia (por rol/ámbito/permiso)
 * Trazabilidad: RF-14 (Autenticación de usuarios) / HU-17 (Acceder al
 * sistema según las responsabilidades asignadas) — los 4 roles que nombra
 * esa HU son Vicerrector, Coordinador, Empleado y Emprendedor; el proyecto
 * llama "Administrativo" al rol que los documentos de requisitos llaman
 * "Empleado" (mismo rol, dos nombres — ver mocks/data/usuarios.ts, idRol 3).
 * RF-15 (Gestión de roles y permisos) / HU-18 — la matriz de permisos por
 * módulo que decide qué ve cada rol dentro del portal admin.
 * Objetivo: Confirmar, navegando de verdad por la interfaz (nunca llamando
 * a `RequireAuth`/`RequirePermiso` directamente), que: sin sesión se
 * redirige al login; un rol de un ámbito no puede entrar al portal del
 * otro; dentro del portal admin, el menú y el acceso por URL directa
 * respetan la matriz de permisos de cada rol — incluido Vicerrector, que no
 * tiene cuenta de demostración en el mock del proyecto y se agrega solo
 * para esta prueba (ver pruebas/mocks/vicerrector.ts); y que ya autenticado,
 * visitar /login redirige de vuelta al propio portal.
 */
import { describe, expect, it } from "vitest"
import { cleanup, render, screen } from "@testing-library/react"
import App from "@/app/App"
import { CREDENCIALES_VICERRECTOR, handlerLoginVicerrector } from "../../mocks/vicerrector"
import { server } from "../msw-server"
import { CUENTAS, iniciarSesion } from "../ayudas"

describe("Sin sesión", () => {
  it("CP-CN-091 — escribir directamente la URL de un módulo protegido redirige a /login", async () => {
    window.history.pushState(null, "", "/admin/entregables")
    render(<App />)

    expect(await screen.findByLabelText("Correo institucional")).toBeInTheDocument()
  })
})

describe("Ámbito incorrecto", () => {
  it("CP-CN-092 — un Emprendedor que escribe una URL del portal admin es devuelto a su propio portal", async () => {
    render(<App />)
    await iniciarSesion(CUENTAS.emprendedor.correo, CUENTAS.emprendedor.contrasena)
    await screen.findByRole("link", { name: "Mis entregables" })

    cleanup()
    window.history.pushState(null, "", "/admin/dashboard")
    render(<App />)

    expect(await screen.findByRole("link", { name: "Mis entregables" })).toBeInTheDocument()
    expect(screen.queryByText("Usuarios y Roles")).not.toBeInTheDocument()
  })
})

describe("Dentro del portal admin, por rol", () => {
  it("CP-CN-093 — Coordinador: ve Usuarios y Roles (permisos completos)", async () => {
    render(<App />)
    await iniciarSesion(CUENTAS.coordinador.correo, CUENTAS.coordinador.contrasena)

    expect(await screen.findByRole("link", { name: "Usuarios y Roles" })).toBeInTheDocument()
  })

  it("CP-CN-094 — Vicerrector: también ve Usuarios y Roles (mismos permisos que Coordinador)", async () => {
    server.use(handlerLoginVicerrector)
    render(<App />)
    await iniciarSesion(CREDENCIALES_VICERRECTOR.correo, CREDENCIALES_VICERRECTOR.contrasena)

    expect(await screen.findByRole("link", { name: "Usuarios y Roles" })).toBeInTheDocument()
  })

  it("CP-CN-095 — Administrativo/Empleado: NO ve Usuarios y Roles (permisos acotados)", async () => {
    render(<App />)
    await iniciarSesion(CUENTAS.administrativo.correo, CUENTAS.administrativo.contrasena)
    await screen.findByRole("link", { name: "Entregables" })

    expect(screen.queryByText("Usuarios y Roles")).not.toBeInTheDocument()
  })

  it("CP-CN-096 — Administrativo/Empleado: escribir la URL directa de Usuarios y Roles igual lo redirige a Mi perfil", async () => {
    render(<App />)
    await iniciarSesion(CUENTAS.administrativo.correo, CUENTAS.administrativo.contrasena)
    await screen.findByRole("link", { name: "Entregables" })

    cleanup()
    window.history.pushState(null, "", "/admin/usuarios-roles")
    render(<App />)

    expect(await screen.findByText("Mi perfil")).toBeInTheDocument()
    expect(screen.queryByText("Usuarios y Roles")).not.toBeInTheDocument()
  })
})

describe("Ya autenticado", () => {
  it("CP-CN-097 — visitar /login redirige de vuelta al propio portal, no muestra el formulario", async () => {
    render(<App />)
    await iniciarSesion(CUENTAS.coordinador.correo, CUENTAS.coordinador.contrasena)
    await screen.findByRole("link", { name: "Usuarios y Roles" })

    cleanup()
    window.history.pushState(null, "", "/login")
    render(<App />)

    expect(await screen.findByRole("link", { name: "Usuarios y Roles" })).toBeInTheDocument()
    expect(screen.queryByLabelText("Correo institucional")).not.toBeInTheDocument()
  })
})
