import type { Jornada } from "@prisma/client"
import { prisma } from "../../lib/prisma.js"
import { emprendedorParaFrontend } from "../../lib/mappers.js"
import { crearCuentaEmprendedor } from "../emprendedores/emprendedores.service.js"
import { ErrorApi } from "../../middleware/errorHandler.js"

function integranteAFrontend(idEmprendimiento: number, emprendedor: Parameters<typeof emprendedorParaFrontend>[0]) {
  return {
    idUsuario: emprendedor.idUsuario ?? "",
    idEmprendimiento,
    emprendedor: emprendedorParaFrontend(emprendedor),
  }
}

/**
 * Agregar un integrante — una sola búsqueda por número de identificación
 * resuelve los 3 casos posibles:
 *  1. Ya existe una cuenta (`idUsuario` presente) → se vincula directo.
 *  2. Existe como precandidato pendiente (llenó el formulario, nunca se
 *     aprobó) → se le crea la cuenta ahora mismo, con los datos que ya
 *     tenía.
 *  3. No existe nada → hace falta `nombre`/`correo` en el payload para
 *     crearlo desde cero (el frontend debe pedirlos si la búsqueda no
 *     encuentra a nadie).
 */
export async function agregarIntegrante(
  idEmprendimiento: number,
  payload: {
    numeroIdentificacion: string
    nombre?: string
    correo?: string
    fechaNacimiento?: string
    programaAcademico?: string
    semestre?: number
    jornada?: Jornada
  },
) {
  let emprendedor = await prisma.emprendedor.findUnique({ where: { numeroIdentificacion: payload.numeroIdentificacion } })

  if (!emprendedor) {
    if (!payload.nombre || !payload.correo) {
      throw new ErrorApi(
        404,
        "No se encontró a nadie con ese número de identificación. Complete nombre y correo para crear la cuenta.",
      )
    }
    emprendedor = await prisma.emprendedor.create({
      data: {
        numeroIdentificacion: payload.numeroIdentificacion,
        nombre: payload.nombre,
        correo: payload.correo,
        estadoPrecandidato: "pendiente",
        fechaNacimiento: payload.fechaNacimiento ? new Date(payload.fechaNacimiento) : undefined,
        programaAcademico: payload.programaAcademico,
        semestre: payload.semestre,
        jornada: payload.jornada,
      },
    })
  }

  if (!emprendedor.idUsuario) {
    emprendedor = await crearCuentaEmprendedor(emprendedor.idEmprendedor)
  }

  const yaEsIntegrante = await prisma.emprendedorEmprendimiento.findUnique({
    where: { idEmprendedor_idEmprendimiento: { idEmprendedor: emprendedor.idEmprendedor, idEmprendimiento } },
  })
  if (yaEsIntegrante) {
    throw new ErrorApi(409, "Esta persona ya es integrante de este emprendimiento.")
  }

  await prisma.emprendedorEmprendimiento.create({
    data: { idEmprendedor: emprendedor.idEmprendedor, idEmprendimiento },
  })

  return integranteAFrontend(idEmprendimiento, emprendedor)
}

/** Corregir el nombre de un integrante. */
export async function editarIntegrante(idEmprendimiento: number, idUsuario: string, nombre: string) {
  const emprendedor = await prisma.emprendedor.findUnique({ where: { idUsuario } })
  if (!emprendedor) {
    throw new ErrorApi(404, "Integrante no encontrado.")
  }
  const actualizado = await prisma.emprendedor.update({ where: { idEmprendedor: emprendedor.idEmprendedor }, data: { nombre } })
  return integranteAFrontend(idEmprendimiento, actualizado)
}

/** No se puede dejar un emprendimiento sin ningún integrante. */
export async function eliminarIntegrante(idEmprendimiento: number, idUsuario: string) {
  const emprendedor = await prisma.emprendedor.findUnique({ where: { idUsuario } })
  if (!emprendedor) {
    throw new ErrorApi(404, "Integrante no encontrado.")
  }

  const totalIntegrantes = await prisma.emprendedorEmprendimiento.count({ where: { idEmprendimiento } })
  if (totalIntegrantes <= 1) {
    throw new ErrorApi(400, "No se puede quitar al único integrante del emprendimiento.")
  }

  await prisma.emprendedorEmprendimiento.delete({
    where: { idEmprendedor_idEmprendimiento: { idEmprendedor: emprendedor.idEmprendedor, idEmprendimiento } },
  })
}
