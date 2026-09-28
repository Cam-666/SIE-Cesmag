import { supabaseAdmin } from "./supabase.js"
import { generarContrasenaTemporal } from "./contrasenaTemporal.js"
import { enviarEnlaceRestablecimiento } from "./enlaceRestablecimiento.js"

/**
 * Crea la cuenta en Supabase Auth para una persona nueva. La cuenta nace con
 * una contraseña aleatoria que nadie conoce; la persona define la suya con
 * el enlace de restablecimiento (ver `enviarEnlaceRestablecimiento` — por
 * ahora queda en la consola del backend hasta que haya un proveedor de correo).
 */
export async function crearCuentaAuth(datos: { correo: string; nombre: string }) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: datos.correo,
    password: generarContrasenaTemporal(),
    email_confirm: true,
    user_metadata: { nombre: datos.nombre },
  })
  if (error || !data.user) {
    return null
  }
  await enviarEnlaceRestablecimiento(datos.correo, "Bienvenida — defina su contraseña")
  return { idUsuario: data.user.id }
}
