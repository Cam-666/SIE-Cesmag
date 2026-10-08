import { supabaseAdmin } from "./supabase.js"
import { enviarCorreo } from "./correo.js"

/**
 * Genera el enlace a `ResetPasswordPage.tsx` (`/restablecer-password?token=...`)
 * y lo envía por correo real. Si el envío falla (p. ej. no hay credenciales
 * de Gmail configuradas), el enlace igual queda registrado en la consola del
 * backend como respaldo. Devuelve `false` solo si Supabase no pudo generar
 * el enlace (p. ej. el correo no existe).
 */
export async function enviarEnlaceRestablecimiento(correo: string, motivo: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({ type: "recovery", email: correo })
  if (error || !data.properties) return false

  const enlace = `${process.env.FRONTEND_URL}/restablecer-password?token=${data.properties.hashed_token}`

  const enviado = await enviarCorreo({
    para: correo,
    asunto: motivo,
    html: `
      <p>${motivo}</p>
      <p><a href="${enlace}">Definir mi contraseña</a></p>
      <p>Si el enlace no funciona, copie y pegue esta dirección en su navegador:<br>${enlace}</p>
    `,
  })
  if (!enviado) {
    console.log(`[correo no enviado — respaldo en consola] ${motivo} para ${correo}: ${enlace}`)
  }
  return true
}
