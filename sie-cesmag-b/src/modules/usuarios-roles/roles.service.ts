import { prisma } from "../../lib/prisma.js"
import { rolParaFrontend } from "../../lib/mappers.js"
import { permisoADb } from "../../lib/modulos.js"
import { IDS_ROL_PROTEGIDO, NOMBRE_ROL_SIN_ROL } from "../../lib/constantes.js"
import { ID_ROL_COORDINADOR, exigirNoEscalada } from "../../lib/escalada.js"
import { ErrorApi } from "../../middleware/errorHandler.js"
import type { PermisoResuelto, UsuarioAutenticado } from "../../types/express.d.ts"

/** Listado de roles con sus permisos. */
export async function listarRoles() {
  const roles = await prisma.rol.findMany({ include: { permisos: true }, orderBy: { idRol: "asc" } })
  return roles.map(rolParaFrontend)
}

/**
 * Los roles creados desde aquí siempre son de ámbito "admin" — el rol de
 * emprendedor no se administra en este módulo. Un rol nuevo no puede conceder
 * permisos que quien lo crea no tenga.
 */
export async function crearRol(
  payload: { nombre: string; descripcion: string; permisos: PermisoResuelto[] },
  actor: UsuarioAutenticado,
) {
  exigirNoEscalada(actor.permisos, payload.permisos)

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

/**
 * Editar los permisos de un rol. Los roles base (Coordinador, Vicerrector) solo
 * los modifica el Coordinador, y nadie puede concederse con un rol permisos que
 * no tiene: así no se puede escalar desde un rol propio con permisos parciales.
 */
export async function editarRol(
  idRol: number,
  payload: { nombre: string; descripcion: string; permisos: PermisoResuelto[] },
  actor: UsuarioAutenticado,
) {
  if (IDS_ROL_PROTEGIDO.includes(idRol) && actor.idRol !== ID_ROL_COORDINADOR) {
    throw new ErrorApi(403, "Solo el Coordinador puede modificar los roles base.")
  }
  exigirNoEscalada(actor.permisos, payload.permisos)

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
 * ámbito) antes de poder borrarlo. Reasignar no puede subir a nadie por
 * encima de los permisos de quien hace la operación.
 */
export async function eliminarRol(idRol: number, idRolReemplazo: number | undefined, actor: UsuarioAutenticado) {
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
    const reemplazo = await prisma.rol.findUnique({ where: { idRol: idRolReemplazo }, include: { permisos: true } })
    if (!reemplazo || reemplazo.ambito !== rol.ambito) {
      throw new ErrorApi(400, "El rol de reemplazo debe existir y ser del mismo ámbito.")
    }
    exigirNoEscalada(actor.permisos, rolParaFrontend(reemplazo).permisos)
    await prisma.usuario.updateMany({ where: { idRol }, data: { idRol: idRolReemplazo } })
  }

  await prisma.rol.delete({ where: { idRol } })
}
