import { z } from "zod"

/** Duraciones de asesoría que tiene sentido ofrecer — ninguna asesoría real dura más de 1 hora. */
export const DURACIONES_ASESORIA_MINUTOS = [15, 30, 45, 60] as const
const duracionAsesoriaSchema = z.union([z.literal(15), z.literal(30), z.literal(45), z.literal(60)])

/** Listado general de asesorías. */
export const filtrosAsesoriasSchema = z.object({
  estado: z.enum(["programada", "completada", "cancelada", "no_realizada", "todos"]).optional(),
})

/**
 * Agendar dentro de un bloque disponible de la propia agenda. `idAgenda` es
 * el bloque atómico donde arranca (la hora de inicio elegida); `duracionMinutos`
 * determina cuántos bloques atómicos consecutivos encadena (ver
 * `resolverCadenaDeBloques` en `agenda.service.ts`). `idEmprendimiento`/`idAgenda`
 * llegan como número (los PK son SERIAL/INTEGER, no UUID).
 */
export const nuevaAsesoriaSchema = z
  .object({
    idEmprendimiento: z.number().int().positive(),
    idAgenda: z.number().int().positive(),
    duracionMinutos: duracionAsesoriaSchema,
    tipoAsesoria: z.enum(["diagnostica", "seguimiento"]),
    modalidad: z.enum(["presencial", "virtual"]),
    etapaIdentificada: z.number().int().positive().nullable().optional(),
  })
  .refine((d) => d.tipoAsesoria !== "diagnostica" || d.etapaIdentificada != null, {
    message: "Seleccione la etapa identificada en el diagnóstico.",
    path: ["etapaIdentificada"],
  })

/** Cancelar libera el bloque de agenda; reprogramar lo cambia por otro bloque disponible. */
export const cancelarReprogramarSchema = z.discriminatedUnion("accion", [
  z.object({
    accion: z.literal("cancelar"),
    motivo: z.string().min(1, "Indique el motivo de la cancelación."),
  }),
  z.object({
    accion: z.literal("reprogramar"),
    nuevoIdAgenda: z.number().int().positive(),
  }),
])

/**
 * Registrar lo ocurrido en una asesoría ya pasada: si se realizó, exige el
 * avance; si no, exige el motivo — igual que la restricción
 * `chk_asesoria_no_realizada_con_observacion` de la base de datos (se valida
 * aquí para devolver un 400 limpio en vez de un error de Postgres).
 */
export const registrarResultadoSchema = z
  .object({
    realizada: z.boolean(),
    avance: z.string().optional(),
    observaciones: z.string().optional(),
  })
  .refine((d) => !d.realizada || (d.avance?.trim().length ?? 0) > 0, {
    message: "Describa el avance o la situación tratada en la asesoría.",
    path: ["avance"],
  })
  .refine((d) => d.realizada || (d.observaciones?.trim().length ?? 0) > 0, {
    message: "Indique el motivo por el que la asesoría no se llevó a cabo.",
    path: ["observaciones"],
  })

/** El emprendedor agenda dentro de un bloque disponible de la agenda del equipo administrativo. */
export const agendarAsesoriaSchema = z.object({
  idAgenda: z.number().int().positive(),
  duracionMinutos: duracionAsesoriaSchema,
  tipoAsesoria: z.enum(["diagnostica", "seguimiento"]),
  modalidad: z.enum(["presencial", "virtual"]),
  motivo: z.string().min(1, "Describa el motivo u objetivo de la asesoría."),
})
