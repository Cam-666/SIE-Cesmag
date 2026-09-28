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

/**
 * Cargar la evidencia de un entregable abierto. `rutaEvidencia`/`nombreArchivo`
 * ya vienen resueltos por la subida a la nube que hace el frontend antes de
 * llamar a esta mutación — el backend nunca recibe el archivo en sí, solo la
 * ruta resultante. Si el payload trae `idEntregable`, se ignora: la fuente de
 * verdad es el `:id` de la URL.
 */
export const cargarEvidenciaSchema = z.object({
  rutaEvidencia: z.string().min(1, "Falta la ruta de la evidencia.").max(500),
  nombreArchivo: z.string().min(1, "Falta el nombre del archivo.").max(255),
  comentario: z.string().optional(),
})
