import { z } from "zod"

/**
 * Nuevo rango de disponibilidad con fecha concreta (no recurrente). No crea
 * un solo bloque con el rango completo — lo trocea en bloques atómicos de 15
 * minutos (ver `GRANULARIDAD_MINUTOS` en `agenda.service.ts`); quien agenda
 * elige la duración real (15/30/45/60 min, `DURACIONES_ASESORIA_MINUTOS` en
 * `asesorias.schemas.ts`) encadenando tantos bloques atómicos consecutivos
 * como haga falta. RF-29 corregido a pedido del profesor evaluador: antes un
 * bloque de 8:00 a 12:00 se agendaba entero en una sola asesoría.
 */
export const nuevoBloqueAgendaSchema = z
  .object({
    fecha: z.string().min(1, "La fecha es obligatoria."),
    horaInicio: z.string().regex(/^\d{2}:\d{2}$/, "Hora de inicio inválida."),
    horaFin: z.string().regex(/^\d{2}:\d{2}$/, "Hora de fin inválida."),
  })
  // Igual que la restricción `chk_agenda_horario` de la base de datos — se
  // valida aquí también para devolver un 400 limpio en vez de un error de Postgres.
  .refine((d) => d.horaFin > d.horaInicio, {
    message: "La hora de fin debe ser posterior a la hora de inicio.",
    path: ["horaFin"],
  })

/** Único campo editable de un bloque desde "Mi disponibilidad" (alternar disponible/bloqueado). */
export const editarBloqueAgendaSchema = z.object({
  estado: z.enum(["disponible", "bloqueado"]),
})
