/**
 * Casos: CP-CN-036 a CP-CN-044
 * Tipo: Unitaria – Caja negra
 * Técnica: Particiones de equivalencia + valores límite
 * Trazabilidad: RF-13 (Registro de usuarios administrativos) / HU-18 —
 * nuevoUsuarioSchema, editarUsuarioSchema. RF-15 (Gestión de roles y
 * permisos) / HU-18 — rolSchema. RF-16 (Asignación de responsables por
 * etapa) / HU-19 — asignarResponsableSchema. editarMiPerfilAdminSchema no
 * tiene RF/HU propia (es una extensión razonable del sistema, igual que ya
 * lo documenta el propio código fuente); se prueba por su validación de correo.
 * Objetivo: Validar los campos obligatorios de cada esquema de administración
 * de usuarios y roles, y el caso particular de `nuevoUsuarioSchema` donde el
 * correo es opcional pero, si se da, debe tener formato válido — incluida la
 * cadena vacía como clase explícitamente aceptada (`.or(z.literal(""))`).
 */
import { describe, expect, it } from "vitest"
import {
  asignarResponsableSchema,
  editarMiPerfilAdminSchema,
  editarUsuarioSchema,
  nuevoUsuarioSchema,
  rolSchema,
} from "@/domain/usuario/schemas"

function mensajes(r: { success: boolean; error?: { issues: { message: string }[] } }) {
  return r.success ? [] : r.error!.issues.map((i) => i.message)
}

describe("nuevoUsuarioSchema (RF-13/HU-18)", () => {
  it("CP-CN-036 — correo vacío ('') es una clase válida explícita, no solo 'ausente'", () => {
    expect(nuevoUsuarioSchema.safeParse({ idRol: "3", correo: "" }).success).toBe(true)
  })

  it("CP-CN-037 — correo con formato inválido (no vacío): 'Ingrese un correo válido.'", () => {
    const r = nuevoUsuarioSchema.safeParse({ idRol: "3", correo: "sin-arroba" })
    expect(mensajes(r)).toContain("Ingrese un correo válido.")
  })

  it("CP-CN-038 — idRol vacío (clase inválida): 'Seleccione un rol.'", () => {
    const r = nuevoUsuarioSchema.safeParse({ idRol: "" })
    expect(mensajes(r)).toContain("Seleccione un rol.")
  })
})

describe("editarUsuarioSchema (RF-13/HU-18)", () => {
  it("CP-CN-039 — idRol vacío (clase inválida)", () => {
    const r = editarUsuarioSchema.safeParse({ idRol: "", activo: true })
    expect(mensajes(r)).toContain("Seleccione un rol.")
  })

  it("CP-CN-040 — completo y válido: pasa", () => {
    expect(editarUsuarioSchema.safeParse({ idRol: "2", activo: false }).success).toBe(true)
  })
})

describe("rolSchema (RF-15/HU-18) — dos campos obligatorios independientes", () => {
  it("CP-CN-041 — ambos vacíos: reporta los dos mensajes a la vez", () => {
    const r = rolSchema.safeParse({ nombre: "", descripcion: "" })
    expect(mensajes(r)).toEqual(["Ingrese el nombre del rol.", "Ingrese una descripción."])
  })

  it("CP-CN-042 — completo: pasa", () => {
    expect(rolSchema.safeParse({ nombre: "Administrativo", descripcion: "Acceso acotado" }).success).toBe(true)
  })
})

describe("asignarResponsableSchema (RF-16/HU-19)", () => {
  it("CP-CN-043 — sin responsable elegido (clase inválida)", () => {
    const r = asignarResponsableSchema.safeParse({ idUsuario: "" })
    expect(mensajes(r)).toContain("Seleccione un responsable.")
  })
})

describe("editarMiPerfilAdminSchema", () => {
  it("CP-CN-044 — correo con formato inválido: 'Correo inválido.'; teléfono es opcional", () => {
    const r = editarMiPerfilAdminSchema.safeParse({ correo: "malo" })
    expect(mensajes(r)).toContain("Correo inválido.")

    expect(editarMiPerfilAdminSchema.safeParse({ correo: "a@unicesmag.edu.co" }).success).toBe(true)
  })
})
