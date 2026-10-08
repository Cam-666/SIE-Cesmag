import { z } from "zod"

const duracionAsesoriaSchema = z.union([z.literal(15), z.literal(30), z.literal(45), z.literal(60)])

/** Agendar dentro de un bloque disponible de la propia agenda. */
export const nuevaAsesoriaSchema = z
  .object({
    idEmprendimiento: z.string().min(1, "Seleccione un emprendimiento."),
    tipoAsesoria: z.enum(["diagnostica", "seguimiento"]),
    idAgenda: z.string().min(1, "Seleccione un horario disponible de su agenda."),
    duracionMinutos: duracionAsesoriaSchema,
    modalidad: z.enum(["presencial", "virtual"]),
    etapaIdentificada: z.string().optional(),
  })
  .refine((data) => data.tipoAsesoria !== "diagnostica" || !!data.etapaIdentificada, {
    message: "Seleccione la etapa identificada en el diagnóstico.",
    path: ["etapaIdentificada"],
  })

export type NuevaAsesoriaFormValues = z.infer<typeof nuevaAsesoriaSchema>

/** Reprogramar exige elegir un nuevo horario disponible en la agenda real del asesor. */
export const reprogramarAsesoriaSchema = z.object({
  idAgenda: z.string().min(1, "Seleccione un nuevo horario disponible."),
})

export type ReprogramarAsesoriaFormValues = z.infer<typeof reprogramarAsesoriaSchema>

/** Cancelar una asesoría agendada. */
export const cancelarAsesoriaSchema = z.object({
  motivo: z.string().min(1, "Indique el motivo de la cancelación."),
})

export type CancelarAsesoriaFormValues = z.infer<typeof cancelarAsesoriaSchema>

/** Agendar dentro de un bloque disponible de la agenda del coordinador. */
export const agendarAsesoriaSchema = z.object({
  tipoAsesoria: z.enum(["diagnostica", "seguimiento"]),
  modalidad: z.enum(["presencial", "virtual"]),
  idAgenda: z.string().min(1, "Seleccione un horario disponible."),
  duracionMinutos: duracionAsesoriaSchema,
  motivo: z.string().min(1, "Describa el motivo u objetivo de la asesoría."),
})

export type AgendarAsesoriaFormValues = z.infer<typeof agendarAsesoriaSchema>

/**
 * Registrar el resultado de una asesoría ya pasada: si se realizó, exige el
 * avance; si no, exige dejar constancia del motivo (evidencia).
 */
export const registrarResultadoSchema = z
  .object({
    realizada: z.enum(["si", "no"]),
    avance: z.string().optional(),
    observaciones: z.string().optional(),
  })
  .refine((data) => data.realizada !== "si" || (data.avance?.trim().length ?? 0) > 0, {
    message: "Describa el avance o la situación tratada en la asesoría.",
    path: ["avance"],
  })
  .refine((data) => data.realizada !== "no" || (data.observaciones?.trim().length ?? 0) > 0, {
    message: "Indique el motivo por el que la asesoría no se llevó a cabo.",
    path: ["observaciones"],
  })

export type RegistrarResultadoFormValues = z.infer<typeof registrarResultadoSchema>
