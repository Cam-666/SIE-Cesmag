import type { FechaISO, Id } from "@/types/common"

/**
 * Módulos del portal administrativo (Vicerrector / Coordinador / Empleado),
 * usados para el control de permisos granular por módulo.
 * Coinciden 1 a 1 con las secciones del sidebar admin.
 */
export type ModuloAdmin =
  | "dashboard"
  | "emprendimientos"
  | "asesorias"
  | "entregables"
  | "reportes"
  | "usuarios-roles"

/** Acciones habilitables por módulo. */
export type AccionPermiso = "ver" | "editar" | "eliminar" | "anadir"

export interface PermisoModulo {
  modulo: ModuloAdmin
  acciones: AccionPermiso[]
}

/**
 * Ámbito del rol: decide a qué portal redirige el login. No es una columna
 * de la tabla ROL; se infiere en el frontend porque los roles son
 * administrables dinámicamente y pueden incluir roles futuros además de
 * los 3 base (Vicerrector, Coordinador, Empleado).
 */
export type AmbitoRol = "admin" | "emprendedor"

/** Entidad ROL (ER), con permisos por módulo resueltos para consumo directo. */
export interface Rol {
  idRol: Id
  nombre: string
  descripcion: string | null
  activo: boolean
  ambito: AmbitoRol
  permisos: PermisoModulo[]
  fechaCreacion: FechaISO
}

/** Entidad USUARIO (ER). */
export interface Usuario {
  idUsuario: Id
  nombre: string
  correo: string
  idRol: Id
  rol?: Rol
  activo: boolean
  fechaCreacion: FechaISO
  // Dato de contacto editable desde "Mi perfil" del portal admin (no vive
  // como columna propia en el ER, igual que `telefono` en EMPRENDEDOR).
  telefono?: string | null
}

/** "Mi perfil" del portal admin: el propio usuario administrativo edita su teléfono y correo. */
export interface EditarMiPerfilAdminPayload {
  telefono?: string | null
  correo?: string
}

/** Responsable asignado a una etapa de la ruta metodológica. */
export interface ResponsableEtapa {
  idEtapa: Id
  /** UUID de Supabase Auth (mismo formato que `Usuario.idUsuario`), no un `Id` autoincremental. */
  idUsuario: string
  usuario?: Usuario
}

/** Registro de un nuevo usuario administrativo. */
export interface NuevoUsuarioPayload {
  nombre: string
  correo: string
  idRol: Id
}

/** Cambio de rol o estado de un usuario administrativo existente. */
export interface EditarUsuarioPayload {
  idUsuario: Id
  idRol: Id
  activo: boolean
}

/** Creación o edición de un rol y su matriz de permisos por módulo. */
export interface RolPayload {
  idRol?: Id
  nombre: string
  descripcion: string
  permisos: PermisoModulo[]
}

/**
 * Eliminar un rol. Si tiene usuarios asignados hay que reasignarlos a otro
 * rol del mismo ámbito antes de borrar (`idRolReemplazo`); se omite si el
 * rol no tiene usuarios.
 */
export interface EliminarRolPayload {
  idRol: Id
  idRolReemplazo?: Id
}

/** Datos para asignar un responsable a una etapa. */
export interface AsignarResponsablePayload {
  idEtapa: Id
  /** UUID de Supabase Auth (mismo formato que `Usuario.idUsuario`), no un `Id` autoincremental. */
  idUsuario: string
}
