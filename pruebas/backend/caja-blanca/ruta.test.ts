/**
 * Casos: CP-CB-001 a CP-CB-007
 * Tipo: Unitaria – Caja blanca
 * Técnica: Análisis de complejidad ciclomática (V(G) = 7, caminos independientes)
 * Trazabilidad: RF-05 (Registro del avance de etapa) / HU-09. RF-09 (Consulta
 * de información del emprendimiento) / HU-13.
 * Objetivo: Cubrir los 7 caminos independientes de `construirRuta()` — ver el
 * grafo de flujo y el cálculo de V(G) por las dos fórmulas (aristas−nodos+2 y
 * decisiones+1) en la respuesta de la Fase 5. Un caso por camino, nunca toca
 * la base de datos real (Prisma mockeado con `vitest-mock-extended`).
 */
import { beforeEach, describe, expect, it, vi } from "vitest"
import { mockDeep, mockReset, type DeepMockProxy } from "vitest-mock-extended"
import type { PrismaClient } from "@prisma/client"

vi.mock("@/lib/prisma.js", () => ({ prisma: mockDeep<PrismaClient>() }))

import { prisma } from "@/lib/prisma.js"
import { construirRuta } from "@/lib/ruta.js"

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>

/** Dos etapas: la primera con dos fases, la segunda con una. */
const ETAPAS = [
  {
    idEtapa: 1,
    numero: 1,
    nombre: "Formación e Ideación",
    fases: [
      { idFase: 1, idEtapa: 1, numero: 1, nombre: "Mentalidad EI", entregablesRequeridos: "Portafolio" },
      { idFase: 2, idEtapa: 1, numero: 2, nombre: "Empatía", entregablesRequeridos: null },
    ],
  },
  {
    idEtapa: 2,
    numero: 2,
    nombre: "Incubación",
    fases: [{ idFase: 3, idEtapa: 2, numero: 1, nombre: "Modelamiento", entregablesRequeridos: "Modelo" }],
  },
]

function fila(idEmprendimientoFase: number, idFase: number, estadoFase: string, fechaFin: Date | null = null) {
  return {
    idEmprendimientoFase,
    idEmprendimiento: 9,
    idFase,
    estadoFase,
    fechaInicio: new Date("2026-09-01T00:00:00Z"),
    fechaFin,
  }
}

function sinActividad() {
  prismaMock.emprendimientoFase.findFirst.mockResolvedValue(null)
  prismaMock.intentoEntrega.findFirst.mockResolvedValue(null)
  prismaMock.asesoria.findFirst.mockResolvedValue(null)
}

beforeEach(() => {
  mockReset(prismaMock)
  prismaMock.etapa.findMany.mockResolvedValue(ETAPAS as never)
  sinActividad()
})

describe("construirRuta — caminos del estado por etapa (D1/D2)", () => {
  it("CP-CB-001 — D1=sí: todas las fases 'completada' → la etapa queda 'completada'", async () => {
    prismaMock.emprendimientoFase.findMany.mockResolvedValue([fila(1, 1, "completada"), fila(2, 2, "completada")] as never)

    const r = await construirRuta(9)

    expect(r.ruta[0].estado).toBe("completada")
  })

  it("CP-CB-002 — D1=no, D2=sí: alguna fase distinta de 'pendiente' → 'en_curso'", async () => {
    prismaMock.emprendimientoFase.findMany.mockResolvedValue([fila(1, 1, "completada")] as never)

    const r = await construirRuta(9)

    expect(r.ruta[0].estado).toBe("en_curso")
  })

  it("CP-CB-003 — D1=no, D2=no: ninguna fila registrada → la etapa queda 'pendiente'", async () => {
    prismaMock.emprendimientoFase.findMany.mockResolvedValue([])

    const r = await construirRuta(9)

    expect(r.ruta[0].estado).toBe("pendiente")
    expect(r.diagnosticoPendiente).toBe(true)
  })
})

describe("construirRuta — resolución de la fase actual (D3/D4/D5/D6)", () => {
  it("CP-CB-004 — D3=no: sin ninguna fila 'en_curso' ni 'pausada' → faseActual queda undefined", async () => {
    prismaMock.emprendimientoFase.findMany.mockResolvedValue([fila(1, 1, "completada")] as never)

    const r = await construirRuta(9)

    expect(r.faseActual).toBeUndefined()
  })

  it("CP-CB-005 — D3=sí, el for da una vuelta sin encontrarla (D5=no) antes de hallarla en la 2ª etapa", async () => {
    // La fase en curso (idFase 3) está en la 2ª etapa, no en la 1ª — el bucle
    // recorre la 1ª etapa completa sin match antes de encontrarla.
    prismaMock.emprendimientoFase.findMany.mockResolvedValue([fila(1, 3, "en_curso")] as never)

    const r = await construirRuta(9)

    expect(r.faseActual?.idFase).toBe(3)
    expect(r.faseActual?.fase.nombre).toBe("Modelamiento")
  })

  it("CP-CB-006 — D6=no: la fase en curso no tiene fechaFin → se expone como null", async () => {
    prismaMock.emprendimientoFase.findMany.mockResolvedValue([fila(1, 1, "en_curso", null)] as never)

    const r = await construirRuta(9)

    expect(r.faseActual?.fechaFin).toBeNull()
  })

  it("CP-CB-006b — D6=sí: con fechaFin, se expone formateada como YYYY-MM-DD", async () => {
    prismaMock.emprendimientoFase.findMany.mockResolvedValue([
      fila(1, 1, "en_curso", new Date("2026-09-30T00:00:00Z")),
    ] as never)

    const r = await construirRuta(9)

    expect(r.faseActual?.fechaFin).toBe("2026-09-30")
  })

  it("CP-CB-007 — una fase 'pausada' (desistimiento) también cuenta como actual, igual que 'en_curso'", async () => {
    prismaMock.emprendimientoFase.findMany.mockResolvedValue([fila(1, 2, "pausada")] as never)

    const r = await construirRuta(9)

    expect(r.faseActual?.estadoFase).toBe("pausada")
  })

  it("CP-CB-007b — caso límite: el for se agota sin encontrar la fase (dato inconsistente) sin reventar", async () => {
    prismaMock.emprendimientoFase.findMany.mockResolvedValue([fila(1, 999, "en_curso")] as never)

    const r = await construirRuta(9)

    expect(r.faseActual).toBeUndefined()
  })
})
