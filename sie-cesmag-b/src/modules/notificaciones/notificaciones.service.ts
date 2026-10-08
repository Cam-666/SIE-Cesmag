import type { Notificacion, TipoNotificacion } from "@prisma/client"
import { prisma } from "../../lib/prisma.js"
import { ErrorApi } from "../../middleware/errorHandler.js"

function notificacionAFrontend(n: Notificacion) {
  return {
    idNotificacion: n.idNotificacion,
    idAsesoria: n.idAsesoria,
    idEntregable: n.idEntregable,
    tipo: n.tipo,
    mensaje: n.mensaje,
    leido: n.leido,
    fechaCreacion: n.fechaCreacion.toISOString(),
  }
}

/**
 * Notificaciones del usuario autenticado, más recientes primero. `take`
 * acota el listado a lo más reciente para no arrastrar años de historial a
 * la campana; no hay paginación para este listado.
 */
export async function listarNotificaciones(idUsuario: string) {
  const notificaciones = await prisma.notificacion.findMany({
    where: { idUsuario },
    orderBy: { fechaCreacion: "desc" },
    take: 50,
  })
  return notificaciones.map(notificacionAFrontend)
}

/** Marca como leída una notificación propia — `updateMany` con ambas llaves evita marcar la de otro usuario. */
export async function marcarLeida(idNotificacion: number, idUsuario: string) {
  const resultado = await prisma.notificacion.updateMany({
    where: { idNotificacion, idUsuario },
    data: { leido: true },
  })
  if (resultado.count === 0) {
    throw new ErrorApi(404, "Notificación no encontrada.")
  }
}

export async function marcarTodasLeidas(idUsuario: string) {
  await prisma.notificacion.updateMany({ where: { idUsuario, leido: false }, data: { leido: true } })
}

/**
 * Crea notificaciones en lote — pensada para que otros módulos avisen a uno
 * o varios usuarios sin reimplementar la creación. Cada fila enlaza a lo
 * sumo un registro (`idAsesoria` XOR `idEntregable`, nunca ambos — ver
 * `chk_notificacion_un_solo_enlace` en checks.sql).
 */
export async function crearNotificaciones(
  filas: {
    idUsuario: string
    tipo: TipoNotificacion
    mensaje: string
    idAsesoria?: number
    idEntregable?: number
  }[],
) {
  if (filas.length === 0) return
  await prisma.notificacion.createMany({
    data: filas.map((f) => ({
      idUsuario: f.idUsuario,
      tipo: f.tipo,
      mensaje: f.mensaje,
      idAsesoria: f.idAsesoria ?? null,
      idEntregable: f.idEntregable ?? null,
    })),
  })
}
