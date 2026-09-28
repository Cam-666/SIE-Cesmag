import type { NextFunction, Request, Response } from "express"
import { supabaseAdmin } from "../lib/supabase.js"
import { resolverUsuarioAutenticado } from "../lib/sesion.js"

/**
 * Valida el token de Supabase Auth enviado como `Authorization: Bearer
 * <token>` y adjunta el perfil resuelto a `req.usuario`. Si el token no es
 * válido, o la cuenta no tiene fila en USUARIO (o está inactiva), corta la
 * petición con 401.
 */
export async function requiereSesion(req: Request, res: Response, next: NextFunction) {
  const encabezado = req.headers.authorization
  const token = encabezado?.startsWith("Bearer ") ? encabezado.slice(7) : null
  if (!token) {
    res.status(401).json({ message: "No autenticado." })
    return
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data.user) {
    res.status(401).json({ message: "Sesión inválida o expirada." })
    return
  }

  req.usuario = await resolverUsuarioAutenticado(data.user.id)
  next()
}
