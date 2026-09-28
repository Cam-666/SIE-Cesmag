import { prisma } from "../../lib/prisma.js"
import { usuarioParaFrontend } from "../../lib/mappers.js"

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

export async function asignarResponsable(idEtapa: number, idUsuario: string) {
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
