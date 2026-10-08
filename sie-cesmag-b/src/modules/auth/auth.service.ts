import { supabaseAdmin } from "../../lib/supabase.js"
import { resolverUsuarioAutenticado } from "../../lib/sesion.js"
import { enviarEnlaceRestablecimiento } from "../../lib/enlaceRestablecimiento.js"
import { ErrorApi } from "../../middleware/errorHandler.js"

/** Valida credenciales contra Supabase Auth y arma la `SesionUsuario` que espera el frontend. */
export async function iniciarSesion(correo: string, contrasena: string) {
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email: correo,
    password: contrasena,
  })
  if (error || !data.session || !data.user) {
    throw new ErrorApi(401, "Correo o contraseña incorrectos.")
  }

  const usuario = await resolverUsuarioAutenticado(data.user.id)
  return { ...usuario, token: data.session.access_token, refreshToken: data.session.refresh_token }
}

/**
 * El token de acceso de Supabase expira (por defecto, a la hora) — sin
 * renovarlo, una sesión abierta más tiempo que eso empieza a fallar con 401
 * en todo, silenciosamente. El refresh token sí dura mucho más, y Supabase
 * entrega uno nuevo en cada renovación (rotación), así que el frontend debe
 * guardar también el que viene en la respuesta, no solo el `token`.
 */
export async function refrescarSesion(refreshToken: string) {
  const { data, error } = await supabaseAdmin.auth.refreshSession({ refresh_token: refreshToken })
  if (error || !data.session || !data.user) {
    throw new ErrorApi(401, "La sesión expiró. Inicie sesión de nuevo.")
  }

  const usuario = await resolverUsuarioAutenticado(data.user.id)
  return { ...usuario, token: data.session.access_token, refreshToken: data.session.refresh_token }
}

/**
 * Genera el enlace nosotros mismos (en vez de dejar que Supabase lo mande
 * con su propio formato de redirección) para que apunte exactamente a
 * `ResetPasswordPage.tsx`. Nunca informa si el correo existe o no, para no
 * permitir enumerar cuentas.
 */
export async function solicitarRecuperacion(correo: string): Promise<void> {
  await enviarEnlaceRestablecimiento(correo, "Restablecimiento de contraseña")
}

/** El mismo enlace/token sirve tanto para invitación (primer ingreso) como para recuperación. */
export async function restablecerContrasena(token: string, nuevaContrasena: string): Promise<void> {
  let verificacion = await supabaseAdmin.auth.verifyOtp({ token_hash: token, type: "recovery" })
  if (verificacion.error) {
    verificacion = await supabaseAdmin.auth.verifyOtp({ token_hash: token, type: "invite" })
  }
  if (verificacion.error || !verificacion.data.user) {
    throw new ErrorApi(400, "El enlace no es válido o ya expiró.")
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(verificacion.data.user.id, {
    password: nuevaContrasena,
  })
  if (error) {
    throw new ErrorApi(500, "No se pudo actualizar la contraseña.")
  }
}
