import { z } from "zod"

/** Nombre, correo y rol del nuevo usuario administrativo. */
export const nuevoUsuarioSchema = z.object({
  nombre: z.string().min(1, "Ingrese el nombre completo."),
  correo: z.string().min(1, "Ingrese el correo institucional.").email("Ingrese un correo válido."),
  idRol: z.string().min(1, "Seleccione un rol."),
})

export type NuevoUsuarioFormValues = z.infer<typeof nuevoUsuarioSchema>

/** Actualizar rol o estado de un usuario. */
export const editarUsuarioSchema = z.object({
  idRol: z.string().min(1, "Seleccione un rol."),
  activo: z.boolean(),
})

export type EditarUsuarioFormValues = z.infer<typeof editarUsuarioSchema>

/** Nombre, descripción y al menos un permiso asignado. */
export const rolSchema = z.object({
  nombre: z.string().min(1, "Ingrese el nombre del rol."),
  descripcion: z.string().min(1, "Ingrese una descripción."),
})

export type RolFormValues = z.infer<typeof rolSchema>

/** Datos para asignar un responsable a una etapa. */
export const asignarResponsableSchema = z.object({
  idUsuario: z.string().min(1, "Seleccione un responsable."),
})

export type AsignarResponsableFormValues = z.infer<typeof asignarResponsableSchema>

/** "Mi perfil" del portal admin — teléfono y correo son editables. */
export const editarMiPerfilAdminSchema = z.object({
  telefono: z.string().optional(),
  correo: z.string().email("Correo inválido."),
})

export type EditarMiPerfilAdminFormValues = z.infer<typeof editarMiPerfilAdminSchema>
