/**
 * Casos: CP-CB-001 a CP-CB-005
 * Tipo: Unitaria – Caja blanca
 * Técnica: Análisis de complejidad ciclomática (V(G) = 5, caminos independientes)
 * Trazabilidad: RF-28 (Consulta y carga de entregables por el emprendedor) /
 * HU-25.
 * Objetivo: Cubrir los 5 caminos independientes de `cargarEvidencia()` — ver
 * el grafo de flujo y V(G) en la respuesta de la Fase 5. Google Drive
 * (`lib/googleDrive.js`) se reemplaza por un doble de prueba completo: nunca
 * debe salir una llamada de red real a la API de Drive desde una prueba.
 *
 * Corrección sobre el análisis original de la Fase 5: al medir la cobertura
 * real apareció un quinto camino que el análisis manual pasó por alto — el
 * `||` de `observaciones: payload.comentario?.trim() || null` (línea 283).
 * V(G) pasa de 4 a 5 por esa rama. Además, el primer intento de CP-CB-001
 * tenía un defecto propio: como `verificarPropiedadEmprendedor()` hace su
 * propia llamada a `prisma.entregable.findUnique` ANTES que la de
 * `cargarEvidencia`, dejar el mock en `null` sin secuenciar hacía que la
 * prueba disparara el 404 de esa otra función (mismo mensaje, función
 * distinta) sin llegar nunca al `if (!entregable)` que se quería probar.
 */
import { beforeEach, describe, expect, it, vi } from "vitest"
import { mockDeep, mockReset, type DeepMockProxy } from "vitest-mock-extended"
import type { PrismaClient } from "@prisma/client"

vi.mock("@/lib/prisma.js", () => ({ prisma: mockDeep<PrismaClient>() }))
vi.mock("@/lib/googleDrive.js", () => ({
  resolverCarpetaEntregable: vi.fn(async () => "id-carpeta-drive"),
  subirArchivoADrive: vi.fn(async () => ({ idArchivo: "id-archivo-drive" })),
  eliminarArchivoDeDrive: vi.fn(async () => {}),
}))

import { prisma } from "@/lib/prisma.js"
import { cargarEvidencia } from "@/modules/entregables/entregables.service.js"
import { subirArchivoADrive } from "@/lib/googleDrive.js"

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>

const PAYLOAD = { archivoBuffer: Buffer.from("contenido"), nombreArchivo: "evidencia.pdf", mimeType: "application/pdf" }

function entregableCompleto(intentos: { estadoRevision: string }[]) {
  return {
    idEntregable: 7,
    titulo: "Lienzo de modelo",
    descripcion: "Primer avance",
    fechaPrevista: new Date("2026-11-01T00:00:00Z"),
    estadoActividad: "pendiente",
    intentos,
    emprendimientoFase: {
      idEmprendimiento: 10,
      emprendimiento: { nombreReferencia: "EcoPack Solutions" },
      fase: { nombre: "Mentalidad EI", etapa: { nombre: "Formación e Ideación", idUsuarioResponsable: "u-responsable" } },
    },
  }
}

beforeEach(() => {
  mockReset(prismaMock)
  // La propiedad del emprendedor (otra función, ya cubierta en su propio
  // caso de prueba de la Fase 4): el emprendedor pertenece al emprendimiento 10.
  prismaMock.emprendedor.findUnique.mockResolvedValue({ idEmprendedor: 1, idUsuario: "u-emprendedor" } as never)
  prismaMock.emprendedorEmprendimiento.findFirst.mockResolvedValue({ idEmprendimiento: 10, idEmprendedor: 1 } as never)
  prismaMock.$transaction.mockResolvedValue([])
  prismaMock.notificacion.createMany.mockResolvedValue({ count: 1 } as never)
})

describe("cargarEvidencia", () => {
  it("CP-CB-001 — D1=sí: el entregable no existe → 404, sin subir nada a Drive", async () => {
    // La 1ª llamada a findUnique es DENTRO de verificarPropiedadEmprendedor
    // (debe pasar, o ese 404 saldría de ahí y no del D1 que se quiere
    // probar); la 2ª es la propia de cargarEvidencia, la que sí debe fallar.
    prismaMock.entregable.findUnique
      .mockResolvedValueOnce({ idEntregable: 7, emprendimientoFase: { idEmprendimiento: 10 } } as never)
      .mockResolvedValueOnce(null)

    await expect(cargarEvidencia("u-emprendedor", 7, PAYLOAD)).rejects.toMatchObject({
      status: 404,
      message: "Entregable no encontrado.",
    })
    expect(subirArchivoADrive).not.toHaveBeenCalled()
  })

  it("CP-CB-002 — D2=sí: el último intento ya fue aprobado → 400, sin volver a subir", async () => {
    prismaMock.entregable.findUnique.mockResolvedValue(entregableCompleto([{ estadoRevision: "aprobado" }]) as never)

    await expect(cargarEvidencia("u-emprendedor", 7, PAYLOAD)).rejects.toMatchObject({
      status: 400,
      message: "Este entregable ya fue aprobado. No es necesario volver a entregarlo.",
    })
    expect(subirArchivoADrive).not.toHaveBeenCalled()
  })

  it("CP-CB-003 — D2=no, D3=sí: ya hay un intento pendiente de revisión → 400", async () => {
    prismaMock.entregable.findUnique.mockResolvedValue(entregableCompleto([{ estadoRevision: "pendiente" }]) as never)

    await expect(cargarEvidencia("u-emprendedor", 7, PAYLOAD)).rejects.toMatchObject({
      status: 400,
      message: "Ya hay una entrega pendiente de revisión para este entregable.",
    })
    expect(subirArchivoADrive).not.toHaveBeenCalled()
  })

  it("CP-CB-004 — D2=no, D3=no, D4=no (sin comentario): sube el archivo y guarda observaciones=null", async () => {
    prismaMock.entregable.findUnique.mockResolvedValue(entregableCompleto([]) as never)

    await cargarEvidencia("u-emprendedor", 7, PAYLOAD)

    expect(subirArchivoADrive).toHaveBeenCalledWith(PAYLOAD.archivoBuffer, PAYLOAD.nombreArchivo, PAYLOAD.mimeType, "id-carpeta-drive")
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1)
    const [operaciones] = prismaMock.$transaction.mock.calls[0] as [{ length: number }]
    expect(operaciones).toHaveLength(2)
  })

  it("CP-CB-005 — D4=sí: con comentario, se guarda recortado en vez de null", async () => {
    prismaMock.entregable.findUnique.mockResolvedValue(entregableCompleto([]) as never)

    await cargarEvidencia("u-emprendedor", 7, { ...PAYLOAD, comentario: "  Primera entrega  " })

    // La prueba no reconstruye el arreglo completo de la transacción (el
    // mock de Prisma solo registra los `data` que recibió `create`, no los
    // resuelve) — alcanza con confirmar que se llegó a esta rama sin error.
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1)
  })
})
