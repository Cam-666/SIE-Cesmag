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
  return { ...usuario, token: data.session.access_token }
}

/**
 * Genera el enlace nosotros mismos (en vez de dejar que Supabase lo mande
 * con su propio formato de redirección) para que apunte exactamente a
 * `ResetPasswordPage.tsx`. El envío real del correo queda pendiente de un
 * proveedor (Resend/SMTP) — por ahora se deja registrado en consola.
 *
 * Nunca informa si el correo existe o no, para no permitir enumerar cuentas.
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
