import { prisma } from "../../lib/prisma.js"
import { rolParaFrontend } from "../../lib/mappers.js"
import { permisoADb } from "../../lib/modulos.js"
import { IDS_ROL_PROTEGIDO, NOMBRE_ROL_SIN_ROL } from "../../lib/constantes.js"
import { ErrorApi } from "../../middleware/errorHandler.js"
import type { ModuloFrontend } from "../../types/express.d.ts"

type PermisoEntrada = { modulo: ModuloFrontend; acciones: string[] }

/** Listado de roles con sus permisos. */
export async function listarRoles() {
  const roles = await prisma.rol.findMany({ include: { permisos: true }, orderBy: { idRol: "asc" } })
  return roles.map(rolParaFrontend)
}

/** Los roles creados desde aquí siempre son de ámbito "admin" — el rol de emprendedor no se administra en este módulo. */
export async function crearRol(payload: { nombre: string; descripcion: string; permisos: PermisoEntrada[] }) {
  const rol = await prisma.rol.create({
    data: {
      nombre: payload.nombre,
      descripcion: payload.descripcion,
      ambito: "admin",
      permisos: { create: payload.permisos.map(permisoADb) },
    },
    include: { permisos: true },
  })
  return rolParaFrontend(rol)
}

export async function editarRol(
  idRol: number,
  payload: { nombre: string; descripcion: string; permisos: PermisoEntrada[] },
) {
  const actual = await prisma.rol.findUnique({ where: { idRol } })
  if (actual?.nombre === NOMBRE_ROL_SIN_ROL) {
    throw new ErrorApi(400, 'El rol reservado "Sin rol" no se puede editar.')
  }

  await prisma.$transaction([
    prisma.rol.update({ where: { idRol }, data: { nombre: payload.nombre, descripcion: payload.descripcion } }),
    prisma.permisoRol.deleteMany({ where: { idRol } }),
    prisma.permisoRol.createMany({
      data: payload.permisos.map((p) => ({ ...permisoADb(p), idRol })),
    }),
  ])
  const rol = await prisma.rol.findUniqueOrThrow({ where: { idRol }, include: { permisos: true } })
  return rolParaFrontend(rol)
}

/**
 * USUARIO.id_rol no admite quedar vacío en la base de datos — si el rol
 * tiene usuarios asignados, hay que reasignarlos a `idRolReemplazo` (mismo
 * ámbito) antes de poder borrarlo.
 */
export async function eliminarRol(idRol: number, idRolReemplazo: number | undefined) {
  if (IDS_ROL_PROTEGIDO.includes(idRol)) {
    throw new ErrorApi(400, "El rol de Coordinador o Vicerrector no se puede eliminar.")
  }
  const rol = await prisma.rol.findUnique({ where: { idRol } })
  if (!rol) {
    throw new ErrorApi(404, "Rol no encontrado.")
  }
  if (rol.nombre === NOMBRE_ROL_SIN_ROL) {
    throw new ErrorApi(400, 'El rol reservado "Sin rol" no se puede eliminar.')
  }

  const afectados = await prisma.usuario.count({ where: { idRol } })
  if (afectados > 0) {
    if (!idRolReemplazo) {
      throw new ErrorApi(400, "Debe indicar a qué rol reasignar los usuarios que tienen este rol.")
    }
    const reemplazo = await prisma.rol.findUnique({ where: { idRol: idRolReemplazo } })
    if (!reemplazo || reemplazo.ambito !== rol.ambito) {
      throw new ErrorApi(400, "El rol de reemplazo debe existir y ser del mismo ámbito.")
    }
    await prisma.usuario.updateMany({ where: { idRol }, data: { idRol: idRolReemplazo } })
  }

  await prisma.rol.delete({ where: { idRol } })
}
