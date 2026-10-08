import { prisma } from "../../lib/prisma.js"
import { supabaseAdmin } from "../../lib/supabase.js"
import { rolParaFrontend, usuarioParaFrontend } from "../../lib/mappers.js"
import { IDS_ROL_PROTEGIDO } from "../../lib/constantes.js"
import { ID_ROL_COORDINADOR, exigirNoEscalada } from "../../lib/escalada.js"
import { crearCuentaAuth } from "../../lib/crearCuentaAuth.js"
import { ErrorApi } from "../../middleware/errorHandler.js"
import type { UsuarioAutenticado } from "../../types/express.d.ts"

const incluirRol = { rol: { include: { permisos: true } } } as const

/** Listado de usuarios administrativos con su rol. */
export async function listarUsuarios() {
  const usuarios = await prisma.usuario.findMany({
    include: incluirRol,
    orderBy: { fechaCreacion: "desc" },
  })
  return usuarios.map(usuarioParaFrontend)
}

/**
 * Verifica que el actor pueda asignar `idRol`: debe ser un rol administrativo
 * (el de emprendedor se gestiona por el flujo de emprendimientos), los roles
 * base solo los asigna el Coordinador, y el rol no puede conceder permisos
 * que el actor no tenga (ver `exigirNoEscalada`).
 */
async function validarRolAsignable(idRol: number, actor: UsuarioAutenticado) {
  const rol = await prisma.rol.findUnique({ where: { idRol }, include: { permisos: true } })
  if (!rol || rol.ambito !== "admin") {
    throw new ErrorApi(400, "Debe seleccionar un rol administrativo.")
  }
  if (IDS_ROL_PROTEGIDO.includes(rol.idRol) && actor.idRol !== ID_ROL_COORDINADOR) {
    throw new ErrorApi(403, "Solo el Coordinador puede asignar los roles base.")
  }
  exigirNoEscalada(actor.permisos, rolParaFrontend(rol).permisos)
}

/** Crea la cuenta en Supabase Auth y su perfil en USUARIO — ver `crearCuentaAuth`. */
export async function crearUsuario(payload: { nombre: string; correo: string; idRol: number }, actor: UsuarioAutenticado) {
  await validarRolAsignable(payload.idRol, actor)

  const cuenta = await crearCuentaAuth({ correo: payload.correo, nombre: payload.nombre })
  if (!cuenta) {
    throw new ErrorApi(409, "No se pudo crear la cuenta — verifique que el correo no esté ya registrado.")
  }

  const usuario = await prisma.usuario.create({
    data: {
      idUsuario: cuenta.idUsuario,
      nombre: payload.nombre,
      correo: payload.correo,
      idRol: payload.idRol,
    },
    include: incluirRol,
  })

  return usuarioParaFrontend(usuario)
}

/**
 * Cambia el rol o el estado (activo/inactivo) de un usuario administrativo
 * existente. El rol de un emprendedor no se toca desde aquí: es lo que le da
 * acceso al portal del emprendedor, y su cuenta va ligada a la fila EMPRENDEDOR
 * (no se puede reasignar a un rol admin sin dejar esa relación huérfana).
 * Nadie puede desactivarse ni cambiar su propio rol, y solo el Coordinador
 * puede modificar a usuarios con un rol base.
 */
export async function editarUsuario(
  idUsuario: string,
  payload: { idRol: number; activo: boolean },
  actor: UsuarioAutenticado,
) {
  if (idUsuario === actor.idUsuario) {
    if (!payload.activo) {
      throw new ErrorApi(400, "No puede desactivar su propia cuenta.")
    }
    if (payload.idRol !== actor.idRol) {
      throw new ErrorApi(400, "No puede cambiar su propio rol.")
    }
  }

  const actual = await prisma.usuario.findUnique({ where: { idUsuario }, include: { rol: true } })
  if (!actual) {
    throw new ErrorApi(404, "Usuario no encontrado.")
  }
  if (actual.rol.ambito === "emprendedor" && payload.idRol !== actual.idRol) {
    throw new ErrorApi(400, "No se puede cambiar el rol de una cuenta de emprendedor.")
  }
  if (IDS_ROL_PROTEGIDO.includes(actual.idRol) && actor.idRol !== ID_ROL_COORDINADOR) {
    throw new ErrorApi(403, "Solo el Coordinador puede modificar a un usuario con rol base.")
  }
  if (payload.idRol !== actual.idRol) {
    await validarRolAsignable(payload.idRol, actor)
  }

  const usuario = await prisma.usuario.update({
    where: { idUsuario },
    data: { idRol: payload.idRol, activo: payload.activo },
    include: incluirRol,
  })
  return usuarioParaFrontend(usuario)
}

/**
 * Elimina la cuenta también de Supabase Auth, no solo el perfil. Una cuenta
 * de emprendedor no se puede borrar por aquí: la fila EMPRENDEDOR exige que
 * todo emprendedor aprobado tenga cuenta (`chk_emprendedor_aprobado_con_cuenta`),
 * así que borrar solo USUARIO deja esa fila en un estado inválido — hay que
 * quitar al emprendedor del emprendimiento en su lugar.
 */
export async function eliminarUsuario(idUsuario: string, idUsuarioActual: string) {
  if (idUsuario === idUsuarioActual) {
    throw new ErrorApi(400, "No puede eliminar su propia cuenta.")
  }
  const usuario = await prisma.usuario.findUnique({ where: { idUsuario }, include: { rol: true } })
  if (!usuario) {
    throw new ErrorApi(404, "Usuario no encontrado.")
  }
  if (usuario.rol.ambito === "emprendedor") {
    throw new ErrorApi(400, "Una cuenta de emprendedor no se puede eliminar desde aquí.")
  }
  if (IDS_ROL_PROTEGIDO.includes(usuario.idRol)) {
    throw new ErrorApi(400, "No se puede eliminar un usuario con rol de Coordinador o Vicerrector.")
  }

  await prisma.usuario.delete({ where: { idUsuario } })
  await supabaseAdmin.auth.admin.deleteUser(idUsuario)
}
