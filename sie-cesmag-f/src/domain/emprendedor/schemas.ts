import { z } from "zod"

/** Edición de datos de contacto (no del emprendimiento). */
export const editarPerfilSchema = z.object({
  telefono: z.string().optional(),
  programaAcademico: z.string().optional(),
})

export type EditarPerfilFormValues = z.infer<typeof editarPerfilSchema>
