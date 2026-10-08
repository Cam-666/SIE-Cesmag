import type { Id } from "@/types/common"
import type { AmbitoRol, PermisoModulo } from "@/domain/usuario/types"

/** Credenciales de acceso. */
export interface Credenciales {
  correo: string
  contrasena: string
}

/** Solicitud de recuperación de contraseña por correo. */
export interface SolicitudRecuperacion {
  correo: string
}

export interface RestablecimientoContrasena {
  token: string
  nuevaContrasena: string
}

/** Sesión activa persistida en el auth-store (Zustand) tras iniciar sesión. */
export interface SesionUsuario {
  /** UUID de Supabase Auth, no un `Id` autoincremental. */
  idUsuario: string
  nombre: string
  correo: string
  idRol: Id
  rolNombre: string
  ambito: AmbitoRol
  /** Permisos por módulo. Vacío para sesiones del portal del emprendedor. */
  permisos: PermisoModulo[]
  token: string
  /** Para renovar `token` cuando expira (típicamente a la hora), sin pedir contraseña de nuevo. */
  refreshToken: string
}
