import { ModuloAdmin } from "@prisma/client"
import type { ModuloFrontend, PermisoResuelto } from "../types/express.d.ts"

/**
 * El enum `ModuloAdmin` de Prisma usa `usuarios_roles` (guion bajo, nombre
 * válido de enum) mapeado en la base de datos a `"usuarios-roles"` (con
 * guion) — pero el Prisma Client devuelve el nombre del lado del schema,
 * no el valor mapeado. El frontend espera literalmente `"usuarios-roles"`
 * (su tipo `ModuloAdmin` en `domain/usuario/types.ts`), así que hay que
 * traducir en ambos sentidos al armar/leer cualquier permiso.
 */
export const MODULO_A_FRONTEND: Record<ModuloAdmin, ModuloFrontend> = {
  [ModuloAdmin.dashboard]: "dashboard",
  [ModuloAdmin.emprendimientos]: "emprendimientos",
  [ModuloAdmin.asesorias]: "asesorias",
  [ModuloAdmin.entregables]: "entregables",
  [ModuloAdmin.reportes]: "reportes",
  [ModuloAdmin.usuarios_roles]: "usuarios-roles",
}

export const MODULO_A_DB: Record<ModuloFrontend, ModuloAdmin> = {
  dashboard: ModuloAdmin.dashboard,
  emprendimientos: ModuloAdmin.emprendimientos,
  asesorias: ModuloAdmin.asesorias,
  entregables: ModuloAdmin.entregables,
  reportes: ModuloAdmin.reportes,
  "usuarios-roles": ModuloAdmin.usuarios_roles,
}

type PermisoRolBooleanos = {
  modulo: ModuloAdmin
  puedeVer: boolean
  puedeEditar: boolean
  puedeEliminar: boolean
  puedeAnadir: boolean
}

/** Traduce las 4 columnas booleanas de PERMISO_ROL al `{ modulo, acciones }` que espera el frontend. */
export function permisoAFrontend(p: PermisoRolBooleanos): PermisoResuelto {
  const acciones: PermisoResuelto["acciones"] = []
  if (p.puedeVer) acciones.push("ver")
  if (p.puedeEditar) acciones.push("editar")
  if (p.puedeEliminar) acciones.push("eliminar")
  if (p.puedeAnadir) acciones.push("anadir")
  return { modulo: MODULO_A_FRONTEND[p.modulo], acciones }
}

/** El camino inverso: de lo que manda el frontend (`{ modulo, acciones }`) a las columnas booleanas de la base de datos. */
export function permisoADb(p: { modulo: ModuloFrontend; acciones: string[] }): PermisoRolBooleanos {
  return {
    modulo: MODULO_A_DB[p.modulo],
    puedeVer: p.acciones.includes("ver"),
    puedeEditar: p.acciones.includes("editar"),
    puedeEliminar: p.acciones.includes("eliminar"),
    puedeAnadir: p.acciones.includes("anadir"),
  }
}
