import { z } from "zod"

/** Credenciales de inicio de sesión. */
export const credencialesSchema = z.object({
  correo: z.string().email("Correo inválido."),
  contrasena: z.string().min(1, "La contraseña es obligatoria."),
})

/** Solicitud de recuperación de contraseña. */
export const solicitudRecuperacionSchema = z.object({
  correo: z.string().email("Correo inválido."),
})

/** Restablecimiento de contraseña. Supabase exige contraseñas de al menos 6 caracteres por defecto. */
export const restablecimientoSchema = z.object({
  token: z.string().min(1, "Enlace inválido."),
  nuevaContrasena: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
})
