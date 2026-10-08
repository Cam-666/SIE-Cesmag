import { z } from "zod"

/** Filtra el listado general de entregables por el estado de revisión del último intento. */
export const filtrosEntregablesSchema = z.object({
  estado: z.enum(["pendiente", "aprobado", "rechazado", "todos"]).optional(),
})

/**
 * Registrar un entregable asignado a un emprendimiento y fase. `idFase`
 * llega como el id de la FASE del catálogo (no `idEmprendimientoFase`); el
 * servicio la resuelve a la fila EMPRENDIMIENTO_FASE correspondiente.
 */
export const nuevoEntregableSchema = z.object({
  idEmprendimiento: z.number().int().positive(),
  idFase: z.number().int().positive(),
  titulo: z.string().min(1, "Ingrese el título.").max(300),
  descripcion: z.string().min(1, "Ingrese la descripción.").max(300),
  fechaPrevista: z.string().min(1, "Seleccione la fecha prevista."),
})

/**
 * Rechazar exige registrar una observación, igual que la restricción
 * `chk_intento_entrega_rechazo_con_observacion` de la base de datos (se
 * valida aquí para devolver un 400 limpio en vez de un error de Postgres).
 */
export const revisarEntregableSchema = z
  .object({
    decision: z.enum(["aprobado", "rechazado"]),
    observaciones: z.string().optional(),
  })
  .refine((d) => d.decision !== "rechazado" || (d.observaciones?.trim().length ?? 0) > 0, {
    message: "Registre una observación explicando el motivo del rechazo.",
    path: ["observaciones"],
  })

/** Formatos de evidencia admitidos — igual que `EXTENSIONES_EVIDENCIA_PERMITIDAS` del frontend (domain/entregable/schemas.ts), validado también aquí como segunda barrera. */
export const EXTENSIONES_EVIDENCIA_PERMITIDAS = [
  ".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".txt",
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".zip", ".rar", ".7z",
]

export const TAMANO_MAXIMO_EVIDENCIA_MB = 20

/**
 * Cargar la evidencia de un entregable abierto: el archivo en sí llega como
 * `multipart/form-data` (campo `archivo`, parseado por multer antes de esta
 * ruta — ver `mi.routes.ts`) y sube directo a Google Drive desde el backend,
 * nunca desde el navegador (las credenciales de la cuenta institucional de
 * Drive no pueden exponerse al cliente). Este schema solo valida el campo de
 * texto que viaja junto al archivo.
 */
export const cargarEvidenciaSchema = z.object({
  comentario: z.string().optional(),
})
