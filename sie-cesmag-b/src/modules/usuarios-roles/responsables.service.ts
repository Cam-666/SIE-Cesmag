import { prisma } from "../../lib/prisma.js"
import { usuarioParaFrontend } from "../../lib/mappers.js"
import { ErrorApi } from "../../middleware/errorHandler.js"

const incluirUsuario = { usuarioResponsable: { include: { rol: { include: { permisos: true } } } } } as const

function aFrontend(etapa: { idEtapa: number; idUsuarioResponsable: string | null; usuarioResponsable: Parameters<typeof usuarioParaFrontend>[0] | null }) {
  return {
    idEtapa: etapa.idEtapa,
    idUsuario: etapa.idUsuarioResponsable ?? "",
    usuario: etapa.usuarioResponsable ? usuarioParaFrontend(etapa.usuarioResponsable) : undefined,
  }
}

/** Solo las etapas que sí tienen responsable asignado — el frontend trata "sin fila" como "sin asignar". */
export async function listarResponsables() {
  const etapas = await prisma.etapa.findMany({
    where: { idUsuarioResponsable: { not: null } },
    include: incluirUsuario,
  })
  return etapas.map(aFrontend)
}

/**
 * El responsable de una etapa siempre debe ser personal administrativo — se
 * le notifican entregas pendientes de revisión de todos los emprendimientos
 * (ver `notificarNuevaEntrega`), así que un emprendedor aquí sería una fuga
 * de datos de otros emprendimientos hacia alguien ajeno a ellos. Se valida
 * en el servidor, no solo en el selector del frontend.
 */
export async function asignarResponsable(idEtapa: number, idUsuario: string) {
  const usuario = await prisma.usuario.findUnique({ where: { idUsuario }, include: { rol: true } })
  if (!usuario || usuario.rol.ambito !== "admin") {
    throw new ErrorApi(400, "El responsable de una etapa debe ser personal administrativo.")
  }

  const etapa = await prisma.etapa.update({
    where: { idEtapa },
    data: { idUsuarioResponsable: idUsuario },
    include: incluirUsuario,
  })
  return aFrontend(etapa)
}

export async function eliminarResponsable(idEtapa: number) {
  await prisma.etapa.update({ where: { idEtapa }, data: { idUsuarioResponsable: null } })
}
