/**
 * Casos: CP-CN-046 a CP-CN-052
 * Tipo: Unitaria – Caja negra
 * Técnica: Particiones de equivalencia + valores límite
 * Trazabilidad: RF-29 (Configuración de disponibilidad de asesoría) —
 * `rangoPermitidoDisponibilidad` acota el rango de fechas en que se puede
 * configurar disponibilidad nueva. `fechaAsesoriaComoLocal`/
 * `ahoraComoFechaAsesoria` son utilidades de apoyo para mostrar y comparar
 * horarios de asesoría (RF-02/RF-32) sin el desfase de zona horaria.
 * Objetivo: Validar que las fechas de asesoría se muestran con la hora de
 * reloj guardada (sin conversión de huso horario), y que la ventana de
 * disponibilidad usa la fecha de Bogotá (no la UTC del servidor) con sus dos
 * clases de equivalencia (día < 20 / día >= 20) y el límite exacto del cambio
 * de año.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ahoraComoFechaAsesoria, fechaAsesoriaComoLocal, rangoPermitidoDisponibilidad } from "@/lib/fecha-asesoria"

describe("fechaAsesoriaComoLocal", () => {
  it("CP-CN-046 — conserva los componentes UTC guardados, sin aplicar conversión de huso horario", () => {
    const local = fechaAsesoriaComoLocal("2026-10-06T14:30:00.000Z")
    expect(local.getHours()).toBe(14)
    expect(local.getMinutes()).toBe(30)
  })
})

describe("ahoraComoFechaAsesoria y rangoPermitidoDisponibilidad", () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it("CP-CN-047 — resta el desfase fijo de Bogotá (UTC-5)", () => {
    vi.setSystemTime(new Date("2026-10-06T12:00:00.000Z"))
    expect(ahoraComoFechaAsesoria().toISOString()).toBe("2026-10-06T07:00:00.000Z")
  })

  it("CP-CN-048 — clase 'día < 20': solo abre el mes en curso", () => {
    vi.setSystemTime(new Date("2026-10-06T12:00:00.000Z"))
    expect(rangoPermitidoDisponibilidad()).toEqual({ desde: "2026-10-06", hasta: "2026-10-31" })
  })

  it("CP-CN-049 — valor límite: día 19 (clase '<20') vs. día 20 (clase '>=20')", () => {
    vi.setSystemTime(new Date("2026-10-19T12:00:00.000Z"))
    expect(rangoPermitidoDisponibilidad()).toEqual({ desde: "2026-10-19", hasta: "2026-10-31" })

    vi.setSystemTime(new Date("2026-10-20T12:00:00.000Z"))
    expect(rangoPermitidoDisponibilidad()).toEqual({ desde: "2026-10-20", hasta: "2026-11-30" })
  })

  it("CP-CN-050 — clase 'día >= 20': abre también el mes siguiente completo", () => {
    vi.setSystemTime(new Date("2026-10-25T12:00:00.000Z"))
    expect(rangoPermitidoDisponibilidad()).toEqual({ desde: "2026-10-25", hasta: "2026-11-30" })
  })

  it("CP-CN-051 — caso límite combinado: diciembre con día >= 20 cruza al 31 de enero del año siguiente", () => {
    vi.setSystemTime(new Date("2026-12-25T12:00:00.000Z"))
    expect(rangoPermitidoDisponibilidad()).toEqual({ desde: "2026-12-25", hasta: "2027-01-31" })
  })

  it("CP-CN-052 — usa la fecha de Bogotá, no la UTC: 22:00 de Bogotá del día 19 es 03:00 UTC del día 20", () => {
    vi.setSystemTime(new Date("2026-10-20T03:00:00.000Z"))
    expect(rangoPermitidoDisponibilidad()).toEqual({ desde: "2026-10-19", hasta: "2026-10-31" })
  })
})
