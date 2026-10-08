import { prisma } from "./prisma.js"
import { permisoAFrontend } from "./modulos.js"
import type { UsuarioAutenticado } from "../types/express.d.ts"
import { ErrorApi } from "../middleware/errorHandler.js"

/**
 * Resuelve el perfil completo (USUARIO + ROL + permisos) de un usuario ya
 * autenticado en Supabase Auth — lo usan tanto el middleware `requiereSesion`
 * (en cada request) como el login (para armar la `SesionUsuario` inicial).
 */
export async function resolverUsuarioAutenticado(idUsuario: string): Promise<UsuarioAutenticado> {
  const usuario = await prisma.usuario.findUnique({
    where: { idUsuario },
    include: { rol: { include: { permisos: true } } },
  })
  if (!usuario || !usuario.activo) {
    throw new ErrorApi(401, "Cuenta no encontrada o inactiva.")
  }
  return {
    idUsuario: usuario.idUsuario,
    nombre: usuario.nombre,
    correo: usuario.correo,
    idRol: usuario.idRol,
    rolNombre: usuario.rol.nombre,
    ambito: usuario.rol.ambito,
    permisos: usuario.rol.permisos.map(permisoAFrontend),
  }
}
