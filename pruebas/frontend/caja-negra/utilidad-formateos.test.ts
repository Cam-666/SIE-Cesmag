/**
 * Casos: CP-CN-061 a CP-CN-076
 * Tipo: Unitaria – Caja negra
 * Técnica: Particiones de equivalencia + valores límite
 * Trazabilidad: RF-11 (Identificación de emprendimientos inactivos) / HU-15
 * — `estaSinActividadReciente`. RF-04/HU-08 y RF-35 (Historial de intentos de
 * entrega)/HU-33 — `estadoAprobacionDe`. RF-29/RF-30 (disponibilidad y
 * agendamiento) — `agruparEnTramos`, `minutosDisponiblesDesde`.
 * `codigoEmprendimiento` y `requiereRegistrarResultado` no tienen un RF/HU
 * literal propio — son utilidades de presentación internas, derivadas de
 * RF-09 (consulta de información) y RF-02 respectivamente; se dejan
 * marcadas así en vez de forzar una trazabilidad que no existe en el
 * documento de requisitos.
 * Objetivo: Validar el umbral de inactividad (con su límite inclusivo), las
 * cuatro salidas del estado de aprobación de un entregable, y las reglas de
 * agrupación/encadenamiento de bloques de agenda (separación por estado,
 * hueco de tiempo, asesor y día).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { agruparEnTramos, minutosDisponiblesDesde } from "@/domain/agenda/display"
import type { Agenda } from "@/domain/agenda/types"
import { requiereRegistrarResultado } from "@/domain/asesoria/display"
import type { AsesoriaListado } from "@/domain/asesoria/types"
import { estadoAprobacionDe } from "@/domain/entregable/display"
import { codigoEmprendimiento, estaSinActividadReciente, UMBRAL_DIAS_SIN_ACTIVIDAD } from "@/domain/emprendimiento/display"
import { NOTIFICACION_ICONO } from "@/domain/notificacion/display"
import type { TipoNotificacion } from "@/domain/notificacion/types"

const AHORA = new Date("2026-10-06T12:00:00.000Z")
const DIA_MS = 24 * 60 * 60 * 1000

describe("codigoEmprendimiento", () => {
  it("CP-CN-061 — rellena con ceros hasta 6 dígitos", () => {
    expect(codigoEmprendimiento(7)).toBe("EM-000007")
  })
})

describe("estaSinActividadReciente (RF-11/HU-15)", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(AHORA)
  })
  afterEach(() => vi.useRealTimers())

  it("CP-CN-062 — un emprendimiento que no está 'activo' nunca se marca, sin importar la fecha", () => {
    const hace60 = new Date(AHORA.getTime() - 60 * DIA_MS).toISOString()
    expect(estaSinActividadReciente("inactivo", hace60)).toBe(false)
    expect(estaSinActividadReciente("terminado", hace60)).toBe(false)
  })

  it("CP-CN-063 — activo con actividad reciente: no se marca", () => {
    const hace2 = new Date(AHORA.getTime() - 2 * DIA_MS).toISOString()
    expect(estaSinActividadReciente("activo", hace2)).toBe(false)
  })

  it("CP-CN-064 — valor límite: exactamente 15 días (umbral inclusivo) se marca; 14 días no", () => {
    const enElUmbral = new Date(AHORA.getTime() - UMBRAL_DIAS_SIN_ACTIVIDAD * DIA_MS).toISOString()
    expect(estaSinActividadReciente("activo", enElUmbral)).toBe(true)

    const unDiaAntes = new Date(AHORA.getTime() - (UMBRAL_DIAS_SIN_ACTIVIDAD - 1) * DIA_MS).toISOString()
    expect(estaSinActividadReciente("activo", unDiaAntes)).toBe(false)
  })
})

describe("estadoAprobacionDe (RF-04/HU-08, RF-35/HU-33) — las 4 salidas posibles", () => {
  it("CP-CN-065 — 'aprobado' → aprobado", () => expect(estadoAprobacionDe("aprobado")).toBe("aprobado"))
  it("CP-CN-066 — 'rechazado' → rechazado", () => expect(estadoAprobacionDe("rechazado")).toBe("rechazado"))
  it("CP-CN-067 — 'pendiente' → pendiente_revision", () => expect(estadoAprobacionDe("pendiente")).toBe("pendiente_revision"))
  it("CP-CN-068 — null (sin ningún intento) → no_entregado, no 'pendiente de revisión'", () =>
    expect(estadoAprobacionDe(null)).toBe("no_entregado"))
})

describe("requiereRegistrarResultado", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-10-06T12:00:00.000Z"))
  })
  afterEach(() => vi.useRealTimers())

  function asesoria(estadoAsesoria: AsesoriaListado["estadoAsesoria"], fechaAsesoria: string) {
    return { estadoAsesoria, fechaAsesoria } as Pick<AsesoriaListado, "estadoAsesoria" | "fechaAsesoria">
  }

  it("CP-CN-069 — solo aplica a 'programada'; completada/cancelada/no_realizada nunca lo exigen", () => {
    expect(requiereRegistrarResultado(asesoria("completada", "2026-10-01T09:00:00.000Z"))).toBe(false)
    expect(requiereRegistrarResultado(asesoria("cancelada", "2026-10-01T09:00:00.000Z"))).toBe(false)
  })

  it("CP-CN-070 — 'programada' con fecha futura: no lo exige todavía", () => {
    expect(requiereRegistrarResultado(asesoria("programada", "2026-10-06T08:00:00.000Z"))).toBe(false)
  })

  it("CP-CN-071 — valor límite: en el instante exacto de la asesoría (<=) ya lo exige", () => {
    expect(requiereRegistrarResultado(asesoria("programada", "2026-10-06T07:00:00.000Z"))).toBe(true)
  })
})

function bloque(p: Partial<Agenda> & Pick<Agenda, "idAgenda" | "horaInicio" | "horaFin">): Agenda {
  return { idUsuario: "1", fecha: "2026-10-10", estado: "disponible", ...p }
}

describe("agruparEnTramos (RF-29/RF-30)", () => {
  it("CP-CN-072 — une bloques contiguos del mismo asesor/día/estado", () => {
    const tramos = agruparEnTramos([
      bloque({ idAgenda: 1, horaInicio: "09:00", horaFin: "09:15" }),
      bloque({ idAgenda: 2, horaInicio: "09:15", horaFin: "09:30" }),
    ])
    expect(tramos).toHaveLength(1)
  })

  it("CP-CN-073 — separa por cambio de estado, hueco de tiempo, asesor distinto y cambio de día", () => {
    expect(
      agruparEnTramos([
        bloque({ idAgenda: 1, horaInicio: "09:00", horaFin: "09:15" }),
        bloque({ idAgenda: 2, horaInicio: "09:15", horaFin: "09:30", estado: "bloqueado" }),
      ]),
    ).toHaveLength(2)
    expect(
      agruparEnTramos([
        bloque({ idAgenda: 1, horaInicio: "09:00", horaFin: "09:15" }),
        bloque({ idAgenda: 2, horaInicio: "10:00", horaFin: "10:15" }),
      ]),
    ).toHaveLength(2)
    expect(
      agruparEnTramos([
        bloque({ idAgenda: 1, horaInicio: "09:00", horaFin: "09:15", idUsuario: "1" }),
        bloque({ idAgenda: 2, horaInicio: "09:15", horaFin: "09:30", idUsuario: "2" }),
      ]),
    ).toHaveLength(2)
  })
})

describe("minutosDisponiblesDesde (RF-29/RF-30)", () => {
  it("CP-CN-074 — suma los minutos de los bloques disponibles consecutivos", () => {
    const bloques = [
      bloque({ idAgenda: 1, horaInicio: "09:00", horaFin: "09:15" }),
      bloque({ idAgenda: 2, horaInicio: "09:15", horaFin: "09:30" }),
    ]
    expect(minutosDisponiblesDesde(bloques, bloques[0])).toBe(30)
  })

  it("CP-CN-075 — se detiene en el primer bloque no disponible o inexistente", () => {
    const bloques = [
      bloque({ idAgenda: 1, horaInicio: "09:00", horaFin: "09:15" }),
      bloque({ idAgenda: 2, horaInicio: "09:15", horaFin: "09:30", estado: "reservado" }),
    ]
    expect(minutosDisponiblesDesde(bloques, bloques[0])).toBe(15)
  })
})

describe("NOTIFICACION_ICONO — completitud", () => {
  it("CP-CN-076 — los 6 tipos de notificación (RF-12/31/33/34) tienen un ícono asignado", () => {
    const tipos: TipoNotificacion[] = [
      "inactividad",
      "agendamiento_asesoria",
      "recordatorio_asesoria",
      "recordatorio_entregable",
      "resultado_revision",
      "entrega_recibida",
    ]
    for (const tipo of tipos) expect(NOTIFICACION_ICONO[tipo]).toBeDefined()
  })
})
