import type { AccionPermiso, ModuloAdmin } from "@/domain/usuario/types"

export const MODULO_ADMIN_LABEL: Record<ModuloAdmin, string> = {
  dashboard: "Dashboard",
  emprendimientos: "Emprendimientos",
  asesorias: "Asesorías",
  entregables: "Entregables",
  reportes: "Reportes e Indicadores",
  "usuarios-roles": "Usuarios y Roles",
}

export const MODULOS_ADMIN: ModuloAdmin[] = [
  "dashboard",
  "emprendimientos",
  "asesorias",
  "entregables",
  "reportes",
  "usuarios-roles",
]

export const ACCION_PERMISO_LABEL: Record<AccionPermiso, string> = {
  ver: "Ver",
  editar: "Editar",
  eliminar: "Eliminar",
  anadir: "Añadir",
}

export const ACCIONES_PERMISO: AccionPermiso[] = ["ver", "editar", "eliminar", "anadir"]

/**
 * Acciones que tiene sentido ofrecer por módulo en la matriz de permisos,
 * según el CRUD que realmente existe en cada uno: Dashboard y Reportes son
 * de solo lectura, y Entregables no tiene eliminación real (un entregable
 * rechazado se vuelve a intentar, no se borra).
 */
export const ACCIONES_DISPONIBLES_POR_MODULO: Record<ModuloAdmin, AccionPermiso[]> = {
  dashboard: ["ver"],
  emprendimientos: ["ver", "anadir", "editar", "eliminar"],
  asesorias: ["ver", "anadir", "editar", "eliminar"],
  entregables: ["ver", "anadir", "editar"],
  reportes: ["ver"],
  "usuarios-roles": ["ver", "anadir", "editar", "eliminar"],
}

/**
 * Coordinador (1) y Vicerrector (2): roles base de la dependencia, nunca
 * eliminables (ni el rol ni sus usuarios). El resto de roles, incluido
 * Administrativo, sí se pueden eliminar.
 */
export const IDS_ROL_PROTEGIDO: readonly number[] = [1, 2]

/**
 * Rol reservado del sistema (sembrado en el backend, sin ningún permiso):
 * destino al eliminar un rol "de todas formas" sin reasignar a otro.
 * Identificado por nombre porque no tiene un ID fijo garantizado. Coincide
 * con `NOMBRE_ROL_SIN_ROL` en `sie-cesmag-b/src/lib/constantes.ts`.
 */
export const NOMBRE_ROL_SIN_ROL = "Sin rol"
