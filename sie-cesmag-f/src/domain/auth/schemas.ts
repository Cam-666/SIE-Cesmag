import { z } from "zod"

/** Credenciales requeridas para iniciar sesión. */
export const credencialesSchema = z.object({
  correo: z
    .string()
    .min(1, "Ingresa tu correo institucional.")
    .email("Ingresa un correo válido."),
  contrasena: z.string().min(1, "Ingresa tu contraseña."),
})

export type CredencialesFormValues = z.infer<typeof credencialesSchema>

/** Solicitud de restablecimiento por correo. */
export const solicitudRecuperacionSchema = z.object({
  correo: z
    .string()
    .min(1, "Ingresa tu correo registrado.")
    .email("Ingresa un correo válido."),
})

export type SolicitudRecuperacionFormValues = z.infer<typeof solicitudRecuperacionSchema>

/** Definición de la nueva contraseña desde el enlace recibido. */
export const restablecimientoSchema = z
  .object({
    nuevaContrasena: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
    confirmarContrasena: z.string().min(1, "Confirma tu nueva contraseña."),
  })
  .refine((data) => data.nuevaContrasena === data.confirmarContrasena, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmarContrasena"],
  })

export type RestablecimientoFormValues = z.infer<typeof restablecimientoSchema>
