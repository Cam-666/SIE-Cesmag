import type { Agenda, EstadoAgenda } from "@/domain/agenda/types"

/** Estado de un bloque tal como lo ve el emprendedor al agendar. */
export const ESTADO_AGENDA_BADGE: Record<
  EstadoAgenda,
  { label: string; variant: "default" | "destructive" | "secondary" | "outline" }
> = {
  disponible: { label: "Disponible", variant: "default" },
  reservado: { label: "Agendado", variant: "secondary" },
  bloqueado: { label: "No disponible", variant: "outline" },
}

/**
 * Cada AGENDA es un bloque atómico de 15 min — para mostrarlos como una
 * agenda de verdad (no una lista de decenas de filas de 15 min) se agrupan
 * en tramos visuales: bloques consecutivos del mismo día, mismo estado y
 * mismo dueño (y misma reserva, si aplica).
 */
export interface TramoAgenda {
  fecha: string
  horaInicio: string
  horaFin: string
  estado: EstadoAgenda
  idUsuario: string
  asesorNombre?: string
  emprendimiento?: string | null
  ids: number[]
}

export function agruparEnTramos(bloques: Agenda[]): TramoAgenda[] {
  const ordenados = [...bloques].sort((a, b) =>
    a.fecha === b.fecha ? a.horaInicio.localeCompare(b.horaInicio) : a.fecha.localeCompare(b.fecha),
  )
  const tramos: TramoAgenda[] = []
  for (const b of ordenados) {
    const actual = tramos[tramos.length - 1]
    const mismoTramo =
      actual &&
      actual.fecha === b.fecha &&
      actual.idUsuario === b.idUsuario &&
      actual.estado === b.estado &&
      actual.horaFin === b.horaInicio &&
      (actual.emprendimiento ?? null) === (b.emprendimiento ?? null)
    if (mismoTramo) {
      actual.horaFin = b.horaFin
      actual.ids.push(b.idAgenda)
    } else {
      tramos.push({
        fecha: b.fecha,
        horaInicio: b.horaInicio,
        horaFin: b.horaFin,
        estado: b.estado,
        idUsuario: b.idUsuario,
        asesorNombre: b.asesorNombre,
        emprendimiento: b.emprendimiento ?? null,
        ids: [b.idAgenda],
      })
    }
  }
  return tramos
}

function minutosEntre(inicio: string, fin: string): number {
  const [h1, m1] = inicio.split(":").map(Number)
  const [h2, m2] = fin.split(":").map(Number)
  return h2 * 60 + m2 - (h1 * 60 + m1)
}

/**
 * Cada AGENDA es un bloque atómico de 15 min (ver `agenda.service.ts` del
 * backend) — para saber cuánto dura la asesoría que cabe a partir de un
 * bloque elegido, se encadenan hacia adelante los bloques consecutivos
 * ("hora fin" de uno = "hora inicio" del siguiente) del mismo asesor y mismo
 * día que sigan "disponible", sumando sus minutos, igual que
 * `resolverCadenaDeBloques` del backend.
 */
export function minutosDisponiblesDesde(bloques: Agenda[], ancla: Agenda): number {
  const porHoraInicio = new Map(
    bloques
      .filter((b) => b.idUsuario === ancla.idUsuario && b.fecha === ancla.fecha)
      .map((b) => [b.horaInicio, b] as const),
  )
  let acumulado = 0
  let horaBuscada = ancla.horaInicio
  for (;;) {
    const bloque = porHoraInicio.get(horaBuscada)
    if (!bloque || bloque.estado !== "disponible") break
    acumulado += minutosEntre(bloque.horaInicio, bloque.horaFin)
    horaBuscada = bloque.horaFin
  }
  return acumulado
}
