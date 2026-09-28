import { z } from "zod"

const moduloFrontendSchema = z.enum([
  "dashboard",
  "emprendimientos",
  "asesorias",
  "entregables",
  "reportes",
  "usuarios-roles",
])
const accionSchema = z.enum(["ver", "editar", "eliminar", "anadir"])
const permisoModuloSchema = z.object({
  modulo: moduloFrontendSchema,
  acciones: z.array(accionSchema),
})

/** Datos para crear un usuario administrativo nuevo. */
export const nuevoUsuarioSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio."),
  correo: z.string().email("Correo inválido."),
  idRol: z.number().int().positive(),
})

/** Cambio de rol o estado de un usuario administrativo. */
export const editarUsuarioSchema = z.object({
  idRol: z.number().int().positive(),
  activo: z.boolean(),
})

/** Datos para crear o editar un rol y sus permisos. */
export const rolPayloadSchema = z.object({
  nombre: z.string().min(1, "El nombre del rol es obligatorio."),
  descripcion: z.string(),
  permisos: z.array(permisoModuloSchema),
})

/** Reasignación obligatoria si el rol a eliminar tiene usuarios. */
export const eliminarRolBodySchema = z.object({
  idRolReemplazo: z.number().int().positive().optional(),
})

/** Asignación del responsable de una etapa. */
export const asignarResponsableSchema = z.object({
  idUsuario: z.string().uuid("Usuario inválido."),
})
