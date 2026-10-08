import type { Agenda } from "@/domain/agenda/types"
import { duracionDeBloque } from "@/mocks/utils/duracion-bloque"

/**
 * Espejo del `resolverCadenaDeBloques` del backend real: encadena, a partir
 * del bloque ancla, tantos bloques atómicos consecutivos y "disponible" como
 * requiera `duracionMinutos`. Devuelve `null` si la cadena no alcanza.
 */
export function resolverCadenaMock(agenda: Agenda[], idAgendaAncla: number, duracionMinutos: number): Agenda[] | null {
  const ancla = agenda.find((a) => a.idAgenda === idAgendaAncla)
  if (!ancla || ancla.estado !== "disponible") return null

  const cadena: Agenda[] = [ancla]
  let acumulado = duracionDeBloque(ancla.horaInicio, ancla.horaFin)
  let horaBuscada = ancla.horaFin

  while (acumulado < duracionMinutos) {
    const siguiente = agenda.find(
      (a) => a.idUsuario === ancla.idUsuario && a.fecha === ancla.fecha && a.horaInicio === horaBuscada && a.estado === "disponible",
    )
    if (!siguiente) return null
    cadena.push(siguiente)
    acumulado += duracionDeBloque(siguiente.horaInicio, siguiente.horaFin)
    horaBuscada = siguiente.horaFin
  }

  return cadena
}

/** Misma idea pero de solo lectura, sin exigir "disponible" (para liberar una cadena ya reservada). */
export function resolverCadenaReservadaMock(agenda: Agenda[], idAgendaAncla: number, duracionMinutos: number): Agenda[] {
  const ancla = agenda.find((a) => a.idAgenda === idAgendaAncla)
  if (!ancla) return []

  const cadena: Agenda[] = [ancla]
  let acumulado = duracionDeBloque(ancla.horaInicio, ancla.horaFin)
  let horaBuscada = ancla.horaFin

  while (acumulado < duracionMinutos) {
    const siguiente = agenda.find((a) => a.idUsuario === ancla.idUsuario && a.fecha === ancla.fecha && a.horaInicio === horaBuscada)
    if (!siguiente) break
    cadena.push(siguiente)
    acumulado += duracionDeBloque(siguiente.horaInicio, siguiente.horaFin)
    horaBuscada = siguiente.horaFin
  }

  return cadena
}
