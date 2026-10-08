import { ErrorApi } from "../middleware/errorHandler.js"
import type { PermisoResuelto } from "../types/express.d.ts"

/** Identificador del rol Coordinador en el seed (ver `prisma/seed.ts`). */
export const ID_ROL_COORDINADOR = 1

/**
 * Pares "módulo:acción" que `objetivo` concede y que `actor` no tiene. Vacío
 * significa que el actor puede conceder todo lo que se le pide.
 */
export function permisosNoPoseidos(actor: PermisoResuelto[], objetivo: PermisoResuelto[]): string[] {
  return objetivo.flatMap((p) =>
    p.acciones
      .filter((accion) => !actor.some((a) => a.modulo === p.modulo && a.acciones.includes(accion)))
      .map((accion) => `${p.modulo}:${accion}`),
  )
}

/**
 * Impide la escalada de privilegios: quien administra usuarios o roles solo
 * puede asignar o conceder permisos que él mismo posee. Sin esta regla, un
 * usuario con "añadir usuarios" podría crear o asignarse el rol Coordinador.
 */
export function exigirNoEscalada(actor: PermisoResuelto[], objetivo: PermisoResuelto[]) {
  if (permisosNoPoseidos(actor, objetivo).length > 0) {
    throw new ErrorApi(403, "No puede asignar permisos que usted no tiene.")
  }
}
