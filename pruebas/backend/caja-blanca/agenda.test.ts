/**
 * Casos: CP-CB-001 a CP-CB-005
 * Tipo: Unitaria – Caja blanca
 * Técnica: Análisis de complejidad ciclomática (V(G) = 5, caminos independientes)
 * Trazabilidad: RF-29 (Configuración de disponibilidad de asesoría) / RF-30
 * (Agendamiento de asesoría por el emprendedor).
 * Objetivo: Cubrir los 5 caminos independientes de `resolverCadenaDeBloques()`
 * — ver el grafo de flujo y V(G) en la respuesta de la Fase 5. Las columnas
 * `horaInicio`/`horaFin` son `@db.Time`, por eso se representan como `Date`
 * ancladas al 1970-01-01 (mismo criterio que `lib/horario.ts`).
 */
import { beforeEach, describe, expect, it, vi } from "vitest"
import { mockDeep, mockReset, type DeepMockProxy } from "vitest-mock-extended"
import type { PrismaClient } from "@prisma/client"

vi.mock("@/lib/prisma.js", () => ({ prisma: mockDeep<PrismaClient>() }))

import { prisma } from "@/lib/prisma.js"
import { resolverCadenaDeBloques } from "@/modules/agenda/agenda.service.js"

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>

function hora(hhmm: string) {
  return new Date(`1970-01-01T${hhmm}:00.000Z`)
}

function bloque(idAgenda: number, horaInicio: string, horaFin: string, estado = "disponible") {
  return {
    idAgenda,
    idUsuario: "u-asesor",
    fecha: new Date("2026-10-10T00:00:00.000Z"),
    horaInicio: hora(horaInicio),
    horaFin: hora(horaFin),
    estado,
  }
}

beforeEach(() => mockReset(prismaMock))

describe("resolverCadenaDeBloques", () => {
  it("CP-CB-001 — D1=no: el bloque ancla no existe → 404", async () => {
    prismaMock.agenda.findUnique.mockResolvedValue(null)

    await expect(resolverCadenaDeBloques(9999, 30)).rejects.toMatchObject({ status: 404 })
  })

  it("CP-CB-002 — D1=sí, D2=no: el ancla existe pero no está disponible → 409", async () => {
    prismaMock.agenda.findUnique.mockResolvedValue(bloque(1, "09:00", "09:15", "reservado") as never)

    await expect(resolverCadenaDeBloques(1, 15)).rejects.toMatchObject({ status: 409 })
  })

  it("CP-CB-003 — D2=sí, D3=no desde el inicio: el ancla solo ya cubre la duración pedida", async () => {
    prismaMock.agenda.findUnique.mockResolvedValue(bloque(1, "09:00", "09:15") as never)

    const cadena = await resolverCadenaDeBloques(1, 15)

    expect(cadena.map((b) => b.idAgenda)).toEqual([1])
  })

  it("CP-CB-004 — D3=sí (varias vueltas), D4=no cada vez: encadena bloques contiguos hasta cubrir la duración", async () => {
    prismaMock.agenda.findUnique.mockResolvedValue(bloque(1, "09:00", "09:15") as never)
    prismaMock.agenda.findFirst
      .mockResolvedValueOnce(bloque(2, "09:15", "09:30") as never)
      .mockResolvedValueOnce(bloque(3, "09:30", "09:45") as never)

    const cadena = await resolverCadenaDeBloques(1, 45)

    expect(cadena.map((b) => b.idAgenda)).toEqual([1, 2, 3])
  })

  it("CP-CB-005 — D3=sí, D4=sí: no hay bloque contiguo suficiente → 409", async () => {
    prismaMock.agenda.findUnique.mockResolvedValue(bloque(1, "09:00", "09:15") as never)
    prismaMock.agenda.findFirst.mockResolvedValue(null)

    await expect(resolverCadenaDeBloques(1, 60)).rejects.toMatchObject({
      status: 409,
      message: expect.stringContaining("disponibilidad continua"),
    })
  })
})
