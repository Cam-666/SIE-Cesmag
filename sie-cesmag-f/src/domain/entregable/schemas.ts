import { z } from "zod"

/** Registro de un entregable asignado a un emprendimiento y fase. */
export const nuevoEntregableSchema = z.object({
  idEmprendimiento: z.string().min(1, "Seleccione un emprendimiento."),
  idFase: z.string().min(1, "Seleccione la fase."),
  titulo: z.string().min(1, "Ingrese el título."),
  descripcion: z.string().min(1, "Ingrese la descripción."),
  fechaPrevista: z.string().min(1, "Seleccione la fecha prevista."),
})

export type NuevoEntregableFormValues = z.infer<typeof nuevoEntregableSchema>

/** Rechazar exige registrar una observación. */
export const revisarEntregableSchema = z
  .object({
    decision: z.enum(["aprobado", "rechazado"]),
    observaciones: z.string().optional(),
  })
  .refine((data) => data.decision !== "rechazado" || (data.observaciones?.trim().length ?? 0) > 0, {
    message: "Registre una observación explicando el motivo del rechazo.",
    path: ["observaciones"],
  })

export type RevisarEntregableFormValues = z.infer<typeof revisarEntregableSchema>

/** Formatos de evidencia admitidos (documentos, imágenes y comprimidos). */
export const EXTENSIONES_EVIDENCIA_PERMITIDAS = [
  ".pdf",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".xls",
  ".xlsx",
  ".txt",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".zip",
  ".rar",
  ".7z",
]

export const TAMANO_MAXIMO_EVIDENCIA_MB = 20

function tieneExtensionPermitida(nombreArchivo: string) {
  const nombreMinuscula = nombreArchivo.toLowerCase()
  return EXTENSIONES_EVIDENCIA_PERMITIDAS.some((extension) => nombreMinuscula.endsWith(extension))
}

/** Carga de la evidencia de un entregable abierto. */
export const cargarEvidenciaSchema = z.object({
  archivo: z
    .custom<FileList>()
    .refine((archivos) => archivos?.length === 1, "Seleccione un archivo para entregar.")
    .refine(
      (archivos) => !archivos?.[0] || tieneExtensionPermitida(archivos[0].name),
      "Formato no permitido. Use un documento, imagen o archivo comprimido (ZIP/RAR/7Z).",
    )
    .refine(
      (archivos) => !archivos?.[0] || archivos[0].size <= TAMANO_MAXIMO_EVIDENCIA_MB * 1024 * 1024,
      `El archivo no debe superar ${TAMANO_MAXIMO_EVIDENCIA_MB} MB.`,
    ),
  comentario: z.string().optional(),
})

export type CargarEvidenciaFormValues = z.infer<typeof cargarEvidenciaSchema>
