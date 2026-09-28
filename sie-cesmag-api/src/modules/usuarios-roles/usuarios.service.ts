import { prisma } from "../../lib/prisma.js"
import { supabaseAdmin } from "../../lib/supabase.js"
import { usuarioParaFrontend } from "../../lib/mappers.js"
import { IDS_ROL_PROTEGIDO } from "../../lib/constantes.js"
import { crearCuentaAuth } from "../../lib/crearCuentaAuth.js"
import { ErrorApi } from "../../middleware/errorHandler.js"

const incluirRol = { rol: { include: { permisos: true } } } as const

/** Listado de usuarios administrativos con su rol. */
export async function listarUsuarios() {
  const usuarios = await prisma.usuario.findMany({
    include: incluirRol,
    orderBy: { fechaCreacion: "desc" },
  })
  return usuarios.map(usuarioParaFrontend)
}

/** Crea la cuenta en Supabase Auth y su perfil en USUARIO — ver `crearCuentaAuth`. */
export async function crearUsuario(payload: { nombre: string; correo: string; idRol: number }) {
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

/** Cambia el rol o el estado (activo/inactivo) de un usuario administrativo existente. */
export async function editarUsuario(idUsuario: string, payload: { idRol: number; activo: boolean }) {
  const usuario = await prisma.usuario.update({
    where: { idUsuario },
    data: { idRol: payload.idRol, activo: payload.activo },
    include: incluirRol,
  })
  return usuarioParaFrontend(usuario)
}

/** Elimina la cuenta también de Supabase Auth, no solo el perfil. */
export async function eliminarUsuario(idUsuario: string, idUsuarioActual: string) {
  if (idUsuario === idUsuarioActual) {
    throw new ErrorApi(400, "No puede eliminar su propia cuenta.")
  }
  const usuario = await prisma.usuario.findUnique({ where: { idUsuario } })
  if (!usuario) {
    throw new ErrorApi(404, "Usuario no encontrado.")
  }
  if (IDS_ROL_PROTEGIDO.includes(usuario.idRol)) {
    throw new ErrorApi(400, "No se puede eliminar un usuario con rol de Coordinador o Vicerrector.")
  }

  await prisma.usuario.delete({ where: { idUsuario } })
  await supabaseAdmin.auth.admin.deleteUser(idUsuario)
}
