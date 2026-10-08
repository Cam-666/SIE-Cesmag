/**
 * Casos: CP-CN-002 a CP-CN-008
 * Tipo: Unitaria – Caja negra
 * Técnica: Particiones de equivalencia + valores límite + tabla de decisión
 * Trazabilidad: RF-14 (Autenticación de usuarios) / HU-17 (Acceder al sistema
 * según las responsabilidades asignadas) — credencialesSchema.
 * RF-24 (Recuperación de contraseña) / HU-20 (Recuperar el acceso mediante
 * restablecimiento de contraseña) — solicitudRecuperacionSchema y restablecimientoSchema.
 * Objetivo: Validar que los esquemas Zod del login y de la recuperación de
 * contraseña aceptan exactamente las entradas válidas y rechazan las
 * inválidas con el mensaje correcto, incluida la condición combinada de
 * restablecimiento (longitud mínima Y coincidencia de las dos contraseñas).
 */
import { describe, expect, it } from "vitest"
import { credencialesSchema, restablecimientoSchema, solicitudRecuperacionSchema } from "@/domain/auth/schemas"

function mensajes(r: { success: boolean; error?: { issues: { message: string }[] } }) {
  return r.success ? [] : r.error!.issues.map((i) => i.message)
}

describe("credencialesSchema (RF-14/HU-17)", () => {
  it("CP-CN-002 — correo y contraseña válidos: pasa", () => {
    expect(credencialesSchema.safeParse({ correo: "a@unicesmag.edu.co", contrasena: "x" }).success).toBe(true)
  })

  it("CP-CN-003 — correo vacío (clase inválida): 'Ingresa tu correo institucional.'", () => {
    const r = credencialesSchema.safeParse({ correo: "", contrasena: "x" })
    expect(mensajes(r)).toContain("Ingresa tu correo institucional.")
  })

  it("CP-CN-004 — correo sin formato de correo (clase inválida): 'Ingresa un correo válido.'", () => {
    const r = credencialesSchema.safeParse({ correo: "no-es-correo", contrasena: "x" })
    expect(mensajes(r)).toContain("Ingresa un correo válido.")
  })

  it("CP-CN-005 — contraseña vacía (clase inválida): 'Ingresa tu contraseña.'", () => {
    const r = credencialesSchema.safeParse({ correo: "a@unicesmag.edu.co", contrasena: "" })
    expect(mensajes(r)).toContain("Ingresa tu contraseña.")
  })
})

describe("solicitudRecuperacionSchema (RF-24/HU-20)", () => {
  it("CP-CN-006 — correo registrado válido: pasa", () => {
    expect(solicitudRecuperacionSchema.safeParse({ correo: "a@unicesmag.edu.co" }).success).toBe(true)
  })

  it("CP-CN-007 — correo con formato inválido: 'Ingresa un correo válido.'", () => {
    const r = solicitudRecuperacionSchema.safeParse({ correo: "malo" })
    expect(mensajes(r)).toContain("Ingresa un correo válido.")
  })
})

describe("restablecimientoSchema (RF-24/HU-20) — tabla de decisión: longitud × coincidencia", () => {
  // | # | longitud >= 8 | coinciden | resultado                              |
  // | 1 | sí            | sí        | válido                                 |
  // | 2 | sí            | no        | inválido — "no coinciden"              |
  // | 3 | no            | sí        | inválido — "al menos 8 caracteres"     |
  // | 4 | no            | no        | inválido — ambos mensajes              |
  it("CP-CN-008.1 — longitud suficiente y coinciden (fila 1): pasa", () => {
    const r = restablecimientoSchema.safeParse({ nuevaContrasena: "cesmag26", confirmarContrasena: "cesmag26" })
    expect(r.success).toBe(true)
  })

  it("CP-CN-008.2 — longitud suficiente pero no coinciden (fila 2)", () => {
    const r = restablecimientoSchema.safeParse({ nuevaContrasena: "cesmag26", confirmarContrasena: "cesmag27" })
    expect(mensajes(r)).toEqual(["Las contraseñas no coinciden."])
  })

  it("CP-CN-008.3 — límite inferior: 7 caracteres (inválido) vs. 8 (válido)", () => {
    const corta = restablecimientoSchema.safeParse({ nuevaContrasena: "cesmag2", confirmarContrasena: "cesmag2" })
    expect(mensajes(corta)).toContain("La contraseña debe tener al menos 8 caracteres.")

    const limite = restablecimientoSchema.safeParse({ nuevaContrasena: "cesmag26", confirmarContrasena: "cesmag26" })
    expect(limite.success).toBe(true)
  })

  it("CP-CN-008.4 — ninguna de las dos condiciones se cumple (fila 4): reporta la de longitud", () => {
    const r = restablecimientoSchema.safeParse({ nuevaContrasena: "abc", confirmarContrasena: "xyz" })
    expect(mensajes(r)).toContain("La contraseña debe tener al menos 8 caracteres.")
  })
})
