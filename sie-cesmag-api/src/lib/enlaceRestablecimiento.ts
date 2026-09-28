import { supabaseAdmin } from "./supabase.js"

/**
 * Genera el enlace a `ResetPasswordPage.tsx` (`/restablecer-password?token=...`)
 * y lo deja registrado en la consola del backend. El envío real por correo
 * queda pendiente de un proveedor SMTP (Resend, etc.): cuando exista, basta
 * con reemplazar el `console.log` por el envío — nadie más cambia.
 * Devuelve `false` si Supabase no pudo generar el enlace (p. ej. el correo no existe).
 */
export async function enviarEnlaceRestablecimiento(correo: string, motivo: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({ type: "recovery", email: correo })
  if (error || !data.properties) return false

  const enlace = `${process.env.FRONTEND_URL}/restablecer-password?token=${data.properties.hashed_token}`
  console.log(`[TODO: enviar por correo real] ${motivo} para ${correo}: ${enlace}`)
  return true
}
