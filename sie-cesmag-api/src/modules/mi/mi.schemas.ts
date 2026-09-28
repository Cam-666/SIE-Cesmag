import { z } from "zod"

/** "Mi perfil" del portal admin — teléfono y correo son editables. */
export const editarMiPerfilAdminSchema = z.object({
  telefono: z.string().nullable().optional(),
  correo: z.string().email("Correo inválido.").optional(),
})

/** "Mi perfil" del portal del emprendedor — solo teléfono y programa académico son editables. */
export const editarMiPerfilSchema = z.object({
  telefono: z.string().optional(),
  programaAcademico: z.string().optional(),
})
