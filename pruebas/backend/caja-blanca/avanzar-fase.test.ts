/**
 * Casos: CP-CB-001 a CP-CB-005
 * Tipo: Unitaria – Caja blanca
 * Técnica: Análisis de complejidad ciclomática (V(G) = 6, caminos independientes)
 * Trazabilidad: RF-05 (Registro del avance de etapa) / HU-09 (Aprobar el
 * cumplimiento para avanzar de etapa).
 * Objetivo: Cubrir los 6 caminos independientes de `avanzarFase()` — ver el
 * grafo de flujo y V(G) en la respuesta de la Fase 5. El caso CP-CB-002 es el
 * más valioso: confirma que el guard `length > 0` evita el "verdadero
 * vacío" de `[].every(...)` (JS devuelve `true` sobre un arreglo vacío), que
 * dejaría avanzar una fase sin ningún entregable aprobado si no estuviera.
 * Los dos caminos de éxito terminan llamando a `obtenerDetalle()` (otra
 * función, con su propia complejidad ya cubierta en el caso 1 de esta
 * fase) — aquí solo se verifica el número de operaciones que arma la
 * transacción, que es lo propio de `avanzarFase`.
 */
import { beforeEach, describe, expect, it, vi } from "vitest"
import { mockDeep, mockReset, type DeepMockProxy } from "vitest-mock-extended"
import type { PrismaClient } from "@prisma/client"

vi.mock("@/lib/prisma.js", () => ({ prisma: mockDeep<PrismaClient>() }))

import { prisma } from "@/lib/prisma.js"
import { avanzarFase } from "@/modules/emprendimientos/emprendimientos.service.js"

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>

function entregable(estadoRevision: string | null) {
  return { intentos: estadoRevision ? [{ idIntentoEntrega: 1, estadoRevision }] : [] }
}

function faseEnCurso(numero: number, entregables: ReturnType<typeof entregable>[]) {
  return {
    idEmprendimientoFase: 50,
    idEmprendimiento: 9,
    idFase: numero,
    fase: { idFase: numero, numero, idEtapa: 1 },
    entregables,
  }
}

/** Deja pasar sin reventar la llamada final a obtenerDetalle() — no es lo que prueba este archivo. */
function mockearObtenerDetalleMinimo() {
  prismaMock.emprendimiento.findUnique.mockResolvedValue({
    idEmprendimiento: 9,
    fechaIngreso: new Date("2026-01-01T00:00:00Z"),
    integrantes: [],
  } as never)
  prismaMock.vistaCaracterizacion.findUnique.mockResolvedValue(null)
  prismaMock.etapa.findMany.mockResolvedValue([])
  prismaMock.emprendimientoFase.findMany.mockResolvedValue([])
  prismaMock.intentoEntrega.findFirst.mockResolvedValue(null)
  prismaMock.asesoria.findFirst.mockResolvedValue(null)
}

beforeEach(() => {
  mockReset(prismaMock)
  prismaMock.$transaction.mockResolvedValue([])
})

describe("avanzarFase", () => {
  it("CP-CB-001 — D1=no: sin ninguna fase en curso → 400", async () => {
    prismaMock.emprendimientoFase.findFirst.mockResolvedValue(null)

    await expect(avanzarFase(9)).rejects.toMatchObject({
      status: 400,
      message: "Este emprendimiento no tiene una fase en curso.",
    })
  })

  it("CP-CB-002 — D2=no (corto-circuito): fase en curso SIN entregables → 400, no un 'true' vacío de .every()", async () => {
    prismaMock.emprendimientoFase.findFirst.mockResolvedValue(faseEnCurso(1, []) as never)

    await expect(avanzarFase(9)).rejects.toMatchObject({
      status: 400,
      message: "Todos los entregables de la fase deben estar aprobados para avanzar.",
    })
  })

  it("CP-CB-003 — D2=sí, D3=no: hay entregables pero uno no está aprobado → 400", async () => {
    prismaMock.emprendimientoFase.findFirst.mockResolvedValue(
      faseEnCurso(1, [entregable("aprobado"), entregable("rechazado")]) as never,
    )

    await expect(avanzarFase(9)).rejects.toMatchObject({ status: 400 })
  })

  it("CP-CB-004 — D4=sí, D5=sí: todo aprobado y existe la fase siguiente → marca ambas (2 operaciones)", async () => {
    prismaMock.emprendimientoFase.findFirst.mockResolvedValue(faseEnCurso(1, [entregable("aprobado")]) as never)
    prismaMock.fase.findUnique.mockResolvedValue({ idFase: 2, numero: 2 } as never)
    mockearObtenerDetalleMinimo()

    await avanzarFase(9)

    const operaciones = prismaMock.$transaction.mock.calls[0][0] as unknown[]
    expect(operaciones).toHaveLength(2)
  })

  it("CP-CB-005 — D4=sí, D5=no: todo aprobado pero es la última fase del catálogo → marca solo la actual (1 operación)", async () => {
    prismaMock.emprendimientoFase.findFirst.mockResolvedValue(faseEnCurso(12, [entregable("aprobado")]) as never)
    prismaMock.fase.findUnique.mockResolvedValue(null)
    mockearObtenerDetalleMinimo()

    await avanzarFase(9)

    const operaciones = prismaMock.$transaction.mock.calls[0][0] as unknown[]
    expect(operaciones).toHaveLength(1)
  })
})
