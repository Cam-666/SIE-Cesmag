import type { NextFunction, Request, Response } from "express"
import type { ModuloFrontend } from "../types/express.d.ts"

type Accion = "ver" | "editar" | "eliminar" | "anadir"

/**
 * Exige que el usuario autenticado (ya resuelto por `requiereSesion`, que
 * debe ir antes en la cadena de middlewares) tenga el permiso indicado para
 * el módulo — la misma matriz que gobierna la UI, ahora también aplicada en
 * el servidor. Nunca basta con que el frontend oculte el botón.
 */
export function requierePermiso(modulo: ModuloFrontend, accion: Accion) {
  return (req: Request, res: Response, next: NextFunction) => {
    const permiso = req.usuario?.permisos.find((p) => p.modulo === modulo)
    if (!permiso?.acciones.includes(accion)) {
      res.status(403).json({ message: "No tiene permiso para realizar esta acción." })
      return
    }
    next()
  }
}
