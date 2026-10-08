import { Router } from "express"
import { requiereSesion } from "../../middleware/auth.js"
import {
  credencialesSchema,
  refrescarSesionSchema,
  restablecimientoSchema,
  solicitudRecuperacionSchema,
} from "../../modules/auth/auth.schemas.js"
import { iniciarSesion, refrescarSesion, restablecerContrasena, solicitarRecuperacion } from "../../modules/auth/auth.service.js"

export const rutasAuth = Router()

/** Inicio de sesión. */
rutasAuth.post("/login", async (req, res) => {
  const { correo, contrasena } = credencialesSchema.parse(req.body)
  const sesion = await iniciarSesion(correo, contrasena)
  res.json(sesion)
})

/**
 * Renueva el token de acceso a partir del refresh token, sin pedir
 * contraseña de nuevo — el token de acceso de Supabase expira (típicamente
 * a la hora); sin esto, cualquier sesión abierta más tiempo que eso
 * empezaba a fallar con 401 en todo, silenciosamente, a media tarea. El
 * interceptor de Axios del frontend llama aquí automáticamente apenas ve un
 * 401, antes de reintentar la petición original.
 */
rutasAuth.post("/refrescar", async (req, res) => {
  const { refreshToken } = refrescarSesionSchema.parse(req.body)
  const sesion = await refrescarSesion(refreshToken)
  res.json(sesion)
})

/**
 * Perfil + permisos actuales de la sesión activa (sin volver a loguear). El
 * frontend lo reconsulta cada cierto tiempo para que un cambio de rol o de
 * permisos hecho desde "Usuarios y Roles" en otra pestaña/sesión se refleje
 * sin esperar a que la persona cierre e inicie sesión de nuevo — antes el
 * botón de una acción ya revocada seguía viéndose habilitado (el backend
 * igual la rechazaba con 403, pero la UI no se enteraba hasta recargar).
 */
rutasAuth.get("/me", requiereSesion, async (req, res) => {
  res.json(req.usuario)
})

/** Solicita el enlace de recuperación de contraseña. */
rutasAuth.post("/recuperar-password", async (req, res) => {
  const { correo } = solicitudRecuperacionSchema.parse(req.body)
  await solicitarRecuperacion(correo)
  res.status(204).end()
})

/** Restablece la contraseña con el token del enlace. */
rutasAuth.post("/restablecer-password", async (req, res) => {
  const { token, nuevaContrasena } = restablecimientoSchema.parse(req.body)
  await restablecerContrasena(token, nuevaContrasena)
  res.status(204).end()
})
