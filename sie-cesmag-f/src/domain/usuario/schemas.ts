import { z } from "zod"

/**
 * Nombre, correo y rol del nuevo usuario. Si el rol elegido es de ámbito
 * "emprendedor", `nombre`/`correo` dejan de ser obligatorios aquí (solo
 * hacen falta si la búsqueda por `numeroIdentificacion` no encuentra a
 * nadie) y en su lugar se exige `idEmprendimiento` — esa combinación de
 * reglas depende de datos externos (el ámbito del rol elegido), así que se
 * valida a mano en el formulario en vez de con `.refine()`.
 */
export const nuevoUsuarioSchema = z.object({
  nombre: z.string().optional(),
  correo: z.string().email("Ingrese un correo válido.").optional().or(z.literal("")),
  idRol: z.string().min(1, "Seleccione un rol."),
  numeroIdentificacion: z.string().optional(),
  idEmprendimiento: z.string().optional(),
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
