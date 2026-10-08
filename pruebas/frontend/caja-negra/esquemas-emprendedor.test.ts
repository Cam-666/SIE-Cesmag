/**
 * Casos: CP-CN-045
 * Tipo: Unitaria – Caja negra
 * Técnica: Particiones de equivalencia
 * Trazabilidad: RF-25 (Consulta y edición de datos personales del
 * emprendedor) / HU-22 (Editar mis datos personales) — editarPerfilSchema.
 * Objetivo: Confirmar que el esquema de "Mi perfil" del emprendedor, con sus
 * dos únicos campos opcionales (teléfono y programa académico, sin
 * validación de formato propia), acepta tanto el objeto vacío como uno
 * completo. Es un caso simple a propósito: no tiene condiciones combinadas
 * ni refine — la única clase de equivalencia real es "presente u opcional".
 */
import { describe, expect, it } from "vitest"
import { editarPerfilSchema } from "@/domain/emprendedor/schemas"

describe("editarPerfilSchema (RF-25/HU-22)", () => {
  it("CP-CN-045 — el objeto vacío y uno completo son ambos válidos (todo opcional)", () => {
    expect(editarPerfilSchema.safeParse({}).success).toBe(true)
    expect(
      editarPerfilSchema.safeParse({ telefono: "3001234567", programaAcademico: "Ingeniería de Sistemas" }).success,
    ).toBe(true)
  })
})
