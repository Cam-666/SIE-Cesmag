/**
 * Casos: CP-CN-027 a CP-CN-035
 * Tipo: Unitaria – Caja negra
 * Técnica: Particiones de equivalencia + valores límite + tabla de decisión
 * Trazabilidad: RF-06 (Gestión del estado del emprendimiento) / HU-10 —
 * cambioEstadoSchema. RF-08 (Registro de reingreso) / HU-12 — reingresoSchema.
 * RF-22 (Registro de integrantes del emprendimiento) / HU-03 —
 * agregarIntegranteSchema, editarIntegranteSchema. RF-21 (Edición de datos de
 * caracterización) / HU-02 — caracterizacionSchema. crearEmprendimientoSchema
 * no tiene una HU propia explícita (es una entrada directa, alternativa al
 * flujo de precandidatos de RF-01/HU-01); se prueba igual por su propio peso
 * de validación.
 * Objetivo: Validar la condición combinada del cambio de estado (el motivo
 * solo es obligatorio para ciertos valores), los campos obligatorios de
 * creación/integrantes, y que la caracterización (sin reglas condicionales
 * propias) acepta tanto el objeto vacío como uno completo.
 */
import { describe, expect, it } from "vitest"
import {
  agregarIntegranteSchema,
  cambioEstadoSchema,
  caracterizacionSchema,
  crearEmprendimientoSchema,
  editarIntegranteSchema,
  reingresoSchema,
} from "@/domain/emprendimiento/schemas"

function mensajes(r: { success: boolean; error?: { issues: { message: string }[] } }) {
  return r.success ? [] : r.error!.issues.map((i) => i.message)
}

describe("cambioEstadoSchema (RF-06/HU-10) — tabla de decisión: estado × motivo", () => {
  // | # | estadoNuevo | motivo presente | resultado |
  // | 1 | activo      | no              | válido    |
  // | 2 | activo      | sí              | válido    |
  // | 3 | inactivo    | no              | inválido  |
  // | 4 | inactivo    | sí              | válido    |
  // | 5 | terminado   | no              | inválido  |
  it("CP-CN-027.1/2 — 'activo' nunca exige motivo (filas 1 y 2)", () => {
    expect(cambioEstadoSchema.safeParse({ estadoNuevo: "activo" }).success).toBe(true)
    expect(cambioEstadoSchema.safeParse({ estadoNuevo: "activo", motivo: "Reactivado" }).success).toBe(true)
  })

  it("CP-CN-027.3 — 'inactivo' sin motivo (fila 3): inválido", () => {
    const r = cambioEstadoSchema.safeParse({ estadoNuevo: "inactivo" })
    expect(mensajes(r)).toContain("El motivo es obligatorio para este estado.")
  })

  it("CP-CN-027.4 — 'inactivo' con motivo (fila 4): válido", () => {
    expect(cambioEstadoSchema.safeParse({ estadoNuevo: "inactivo", motivo: "Sin actividad" }).success).toBe(true)
  })

  it("CP-CN-027.5 — 'terminado' sin motivo (fila 5, misma rama que 'inactivo'): inválido", () => {
    const r = cambioEstadoSchema.safeParse({ estadoNuevo: "terminado" })
    expect(mensajes(r)).toContain("El motivo es obligatorio para este estado.")
  })
})

describe("reingresoSchema (RF-08/HU-12)", () => {
  it("CP-CN-028 — fecha de reingreso vacía (clase inválida)", () => {
    const r = reingresoSchema.safeParse({ fechaReingreso: "" })
    expect(mensajes(r)).toContain("Seleccione la fecha de reingreso.")
  })
})

describe("crearEmprendimientoSchema", () => {
  const completo = {
    nombreReferencia: "EcoPack Solutions",
    numeroIdentificacion: "1234567890",
    nombre: "María López",
    correo: "maria@unicesmag.edu.co",
  }

  it("CP-CN-029 — los 4 campos completos: pasa", () => {
    expect(crearEmprendimientoSchema.safeParse(completo).success).toBe(true)
  })

  it("CP-CN-030 — correo con formato inválido: 'Correo inválido.'", () => {
    const r = crearEmprendimientoSchema.safeParse({ ...completo, correo: "mal" })
    expect(mensajes(r)).toContain("Correo inválido.")
  })
})

describe("agregarIntegranteSchema (RF-22/HU-03)", () => {
  it("CP-CN-031 — solo el número de identificación (nombre/correo opcionales): pasa", () => {
    expect(agregarIntegranteSchema.safeParse({ numeroIdentificacion: "123" }).success).toBe(true)
  })

  it("CP-CN-032 — número de identificación vacío (clase inválida)", () => {
    const r = agregarIntegranteSchema.safeParse({ numeroIdentificacion: "" })
    expect(mensajes(r)).toContain("Ingrese el número de identificación.")
  })

  it("CP-CN-033 — si se da correo, igual debe tener formato válido aunque el campo sea opcional", () => {
    const r = agregarIntegranteSchema.safeParse({ numeroIdentificacion: "123", correo: "mal" })
    expect(mensajes(r)).toContain("Correo inválido.")
  })
})

describe("editarIntegranteSchema (RF-22/HU-03)", () => {
  it("CP-CN-034 — nombre vacío (clase inválida)", () => {
    const r = editarIntegranteSchema.safeParse({ nombre: "" })
    expect(mensajes(r)).toContain("Ingrese el nombre.")
  })
})

describe("caracterizacionSchema (RF-21/HU-02)", () => {
  // Sin refine ni enum: los 20 campos son texto opcional/nulo, así que no hay
  // clases de equivalencia propias que probar más allá de "acepta vacío y
  // acepta completo" — se deja constancia explícita de que es un caso trivial.
  it("CP-CN-035 — el objeto vacío (todo opcional) y uno completo son ambos válidos", () => {
    expect(caracterizacionSchema.safeParse({}).success).toBe(true)
    expect(
      caracterizacionSchema.safeParse({ sector: "Tecnología", numeroPersonas: "4", tieneVentas: "Sí" }).success,
    ).toBe(true)
  })
})
