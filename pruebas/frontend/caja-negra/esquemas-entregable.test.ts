/**
 * Casos: CP-CN-018 a CP-CN-026
 * Tipo: Unitaria – Caja negra
 * Técnica: Particiones de equivalencia + valores límite + tabla de decisión
 * Trazabilidad: RF-03 (Registro de actividades, entregables y evidencias) / HU-07
 * — nuevoEntregableSchema. RF-04 (Consulta y actualización del estado de
 * actividades y entregables) / HU-08 — revisarEntregableSchema. RF-28
 * (Consulta y carga de entregables por el emprendedor) / HU-25 — cargarEvidenciaSchema.
 * Objetivo: Validar los campos obligatorios del registro de un entregable, la
 * condición combinada de la revisión (rechazo exige observación) y las tres
 * reglas de la carga de evidencia (cantidad de archivos, extensión permitida
 * y tamaño máximo), con sus valores límite.
 */
import { describe, expect, it } from "vitest"
import { cargarEvidenciaSchema, nuevoEntregableSchema, revisarEntregableSchema } from "@/domain/entregable/schemas"

function mensajes(r: { success: boolean; error?: { issues: { message: string }[] } }) {
  return r.success ? [] : r.error!.issues.map((i) => i.message)
}

/** FileList mínimo: el esquema solo lee `length`, `[0].name` y `[0].size`. */
function listaArchivos(nombre: string, bytes: number) {
  return { length: 1, 0: { name: nombre, size: bytes } } as unknown as FileList
}

const MB = 1024 * 1024

describe("nuevoEntregableSchema (RF-03/HU-07) — cada campo obligatorio por separado", () => {
  const completo = {
    idEmprendimiento: "1",
    idFase: "2",
    titulo: "Lienzo de modelo",
    descripcion: "Primer avance",
    fechaPrevista: "2026-11-01",
  }

  it("CP-CN-018 — los 5 campos completos: pasa", () => {
    expect(nuevoEntregableSchema.safeParse(completo).success).toBe(true)
  })

  it.each([
    ["idEmprendimiento", "Seleccione un emprendimiento."],
    ["idFase", "Seleccione la fase."],
    ["titulo", "Ingrese el título."],
    ["descripcion", "Ingrese la descripción."],
    ["fechaPrevista", "Seleccione la fecha prevista."],
  ] as const)("CP-CN-019 — %s vacío reporta '%s'", (campo, mensaje) => {
    const r = nuevoEntregableSchema.safeParse({ ...completo, [campo]: "" })
    expect(mensajes(r)).toContain(mensaje)
  })
})

describe("revisarEntregableSchema (RF-04/HU-08) — tabla de decisión: decisión × observación", () => {
  // | # | decision  | observaciones    | resultado |
  // | 1 | aprobado  | ausente          | válido    |
  // | 2 | rechazado | presente         | válido    |
  // | 3 | rechazado | ausente/espacios | inválido  |
  it("CP-CN-020 — aprobar sin observaciones (fila 1): pasa", () => {
    expect(revisarEntregableSchema.safeParse({ decision: "aprobado" }).success).toBe(true)
  })

  it("CP-CN-021 — rechazar con observaciones (fila 2): pasa", () => {
    expect(revisarEntregableSchema.safeParse({ decision: "rechazado", observaciones: "Falta evidencia" }).success).toBe(true)
  })

  it("CP-CN-022 — rechazar sin observaciones, solo espacios (fila 3, límite del .trim())", () => {
    const r = revisarEntregableSchema.safeParse({ decision: "rechazado", observaciones: "   " })
    expect(mensajes(r)).toContain("Registre una observación explicando el motivo del rechazo.")
  })
})

describe("cargarEvidenciaSchema (RF-28/HU-25)", () => {
  it("CP-CN-023 — clase de cantidad: 0 archivos es inválido", () => {
    const r = cargarEvidenciaSchema.safeParse({ archivo: { length: 0 } })
    expect(mensajes(r)).toContain("Seleccione un archivo para entregar.")
  })

  it("CP-CN-024 — clase de extensión: permitida (.pdf, sin distinguir mayúsculas) vs. no permitida (.exe)", () => {
    expect(cargarEvidenciaSchema.safeParse({ archivo: listaArchivos("Informe.PDF", 1000) }).success).toBe(true)
    const r = cargarEvidenciaSchema.safeParse({ archivo: listaArchivos("virus.exe", 1000) })
    expect(mensajes(r).join(" ")).toContain("Formato no permitido")
  })

  it("CP-CN-025 — valor límite de tamaño: 20 MB exactos (válido) vs. 20 MB + 1 byte (inválido)", () => {
    const limite = cargarEvidenciaSchema.safeParse({ archivo: listaArchivos("limite.zip", 20 * MB) })
    expect(limite.success).toBe(true)

    const excedido = cargarEvidenciaSchema.safeParse({ archivo: listaArchivos("excedido.zip", 20 * MB + 1) })
    expect(mensajes(excedido).join(" ")).toContain("20 MB")
  })

  it("CP-CN-026 — el comentario es opcional", () => {
    const r = cargarEvidenciaSchema.safeParse({ archivo: listaArchivos("evidencia.pdf", 1000) })
    expect(r.success).toBe(true)
  })
})
