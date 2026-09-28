/** Un módulo del portal admin ya traducido al formato que espera el frontend ("usuarios-roles", con guion). */
export type ModuloFrontend =
  | "dashboard"
  | "emprendimientos"
  | "asesorias"
  | "entregables"
  | "reportes"
  | "usuarios-roles"

export interface PermisoResuelto {
  modulo: ModuloFrontend
  acciones: ("ver" | "editar" | "eliminar" | "anadir")[]
}

/** Perfil resuelto (USUARIO + ROL + permisos) que adjunta `requiereSesion` a cada request autenticado. */
export interface UsuarioAutenticado {
  idUsuario: string
  nombre: string
  correo: string
  idRol: number
  rolNombre: string
  ambito: string
  permisos: PermisoResuelto[]
}

declare global {
  namespace Express {
    interface Request {
      usuario?: UsuarioAutenticado
    }
  }
}
