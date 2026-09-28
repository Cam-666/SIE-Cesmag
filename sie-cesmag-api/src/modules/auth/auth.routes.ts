import { Router } from "express"
import { credencialesSchema, restablecimientoSchema, solicitudRecuperacionSchema } from "./auth.schemas.js"
import { iniciarSesion, restablecerContrasena, solicitarRecuperacion } from "./auth.service.js"

export const rutasAuth = Router()

/** Inicio de sesión. */
rutasAuth.post("/login", async (req, res) => {
  const { correo, contrasena } = credencialesSchema.parse(req.body)
  const sesion = await iniciarSesion(correo, contrasena)
  res.json(sesion)
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
