/**
 * Casos: CP-CN-009 a CP-CN-017
 * Tipo: Unitaria – Caja negra
 * Técnica: Particiones de equivalencia + valores límite + tabla de decisión
 * Trazabilidad: RF-02 (Registro de asesorías) / HU-06 — nuevaAsesoriaSchema.
 * RF-30 (Agendamiento de asesoría por el emprendedor) / HU-27 — agendarAsesoriaSchema.
 * RF-32 (Cancelación o reprogramación de asesoría) / HU-30 — reprogramarAsesoriaSchema,
 * cancelarAsesoriaSchema y registrarResultadoSchema (registrar lo ocurrido).
 * Objetivo: Validar las dos condiciones combinadas del módulo de asesorías —
 * tipo de asesoría × etapa identificada, y resultado (sí/no) × campo exigido
 * — y el conjunto cerrado de duraciones permitidas.
 */
import { describe, expect, it } from "vitest"
import {
  agendarAsesoriaSchema,
  cancelarAsesoriaSchema,
  nuevaAsesoriaSchema,
  registrarResultadoSchema,
  reprogramarAsesoriaSchema,
} from "@/domain/asesoria/schemas"

function mensajes(r: { success: boolean; error?: { issues: { message: string }[] } }) {
  return r.success ? [] : r.error!.issues.map((i) => i.message)
}

const baseNueva = {
  idEmprendimiento: "3",
  idAgenda: "10",
  duracionMinutos: 30 as const,
  modalidad: "virtual" as const,
}

describe("nuevaAsesoriaSchema (RF-02/HU-06) — tabla de decisión: tipo × etapa identificada", () => {
  // | # | tipoAsesoria  | etapaIdentificada | resultado |
  // | 1 | diagnostica   | presente           | válido    |
  // | 2 | diagnostica   | ausente            | inválido  |
  // | 3 | seguimiento   | presente           | válido    |
  // | 4 | seguimiento   | ausente            | válido    |
  it("CP-CN-009.1 — diagnóstica con etapa identificada (fila 1): pasa", () => {
    const r = nuevaAsesoriaSchema.safeParse({ ...baseNueva, tipoAsesoria: "diagnostica", etapaIdentificada: "1" })
    expect(r.success).toBe(true)
  })

  it("CP-CN-009.2 — diagnóstica sin etapa identificada (fila 2): inválido", () => {
    const r = nuevaAsesoriaSchema.safeParse({ ...baseNueva, tipoAsesoria: "diagnostica" })
    expect(mensajes(r)).toContain("Seleccione la etapa identificada en el diagnóstico.")
  })

  it("CP-CN-009.3/4 — seguimiento, con o sin etapa identificada (filas 3 y 4): siempre válido", () => {
    expect(nuevaAsesoriaSchema.safeParse({ ...baseNueva, tipoAsesoria: "seguimiento", etapaIdentificada: "2" }).success).toBe(true)
    expect(nuevaAsesoriaSchema.safeParse({ ...baseNueva, tipoAsesoria: "seguimiento" }).success).toBe(true)
  })

  it("CP-CN-010 — clase de duración: valores del conjunto {15,30,45,60} válidos, fuera del conjunto inválido", () => {
    for (const minutos of [15, 30, 45, 60] as const) {
      expect(nuevaAsesoriaSchema.safeParse({ ...baseNueva, tipoAsesoria: "seguimiento", duracionMinutos: minutos }).success).toBe(true)
    }
    expect(nuevaAsesoriaSchema.safeParse({ ...baseNueva, tipoAsesoria: "seguimiento", duracionMinutos: 20 }).success).toBe(false)
  })
})

describe("agendarAsesoriaSchema (RF-30/HU-27)", () => {
  const base = { tipoAsesoria: "seguimiento" as const, modalidad: "presencial" as const, idAgenda: "5", duracionMinutos: 30 as const }

  it("CP-CN-011 — completo y con motivo: pasa", () => {
    expect(agendarAsesoriaSchema.safeParse({ ...base, motivo: "Revisión de avance" }).success).toBe(true)
  })

  it("CP-CN-012 — motivo vacío (clase inválida): 'Describa el motivo u objetivo de la asesoría.'", () => {
    const r = agendarAsesoriaSchema.safeParse({ ...base, motivo: "" })
    expect(mensajes(r)).toContain("Describa el motivo u objetivo de la asesoría.")
  })
})

describe("reprogramarAsesoriaSchema y cancelarAsesoriaSchema (RF-32/HU-30)", () => {
  it("CP-CN-013 — reprogramar sin horario (clase inválida): 'Seleccione un nuevo horario disponible.'", () => {
    const r = reprogramarAsesoriaSchema.safeParse({ idAgenda: "" })
    expect(mensajes(r)).toContain("Seleccione un nuevo horario disponible.")
  })

  it("CP-CN-014 — cancelar sin motivo (clase inválida): 'Indique el motivo de la cancelación.'", () => {
    const r = cancelarAsesoriaSchema.safeParse({ motivo: "" })
    expect(mensajes(r)).toContain("Indique el motivo de la cancelación.")
  })
})

describe("registrarResultadoSchema (RF-32) — tabla de decisión: realizada × campo exigido", () => {
  // | # | realizada | avance presente | observaciones presente | resultado |
  // | 1 | si        | sí               | —                       | válido    |
  // | 2 | si        | no (vacío/espacios) | —                    | inválido  |
  // | 3 | no        | —                | sí                      | válido    |
  // | 4 | no        | —                | no (vacío/espacios)     | inválido  |
  it("CP-CN-015.1 — realizada=si con avance (fila 1): pasa", () => {
    expect(registrarResultadoSchema.safeParse({ realizada: "si", avance: "Se revisó el modelo" }).success).toBe(true)
  })

  it("CP-CN-015.2 — realizada=si con avance solo de espacios (fila 2, límite del .trim())", () => {
    const r = registrarResultadoSchema.safeParse({ realizada: "si", avance: "   " })
    expect(mensajes(r)).toContain("Describa el avance o la situación tratada en la asesoría.")
  })

  it("CP-CN-016.1 — realizada=no con observaciones (fila 3): pasa", () => {
    expect(registrarResultadoSchema.safeParse({ realizada: "no", observaciones: "No asistió" }).success).toBe(true)
  })

  it("CP-CN-016.2 — realizada=no sin observaciones (fila 4)", () => {
    const r = registrarResultadoSchema.safeParse({ realizada: "no", observaciones: "" })
    expect(mensajes(r)).toContain("Indique el motivo por el que la asesoría no se llevó a cabo.")
  })

  it("CP-CN-017 — realizada=si no exige observaciones, y realizada=no no exige avance (independencia de ramas)", () => {
    expect(registrarResultadoSchema.safeParse({ realizada: "si", avance: "Avanzó bien" }).success).toBe(true)
    expect(registrarResultadoSchema.safeParse({ realizada: "no", observaciones: "No se presentó" }).success).toBe(true)
  })
})
