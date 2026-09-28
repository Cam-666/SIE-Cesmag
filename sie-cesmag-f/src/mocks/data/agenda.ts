import type { Agenda } from "@/domain/agenda/types"
import { persistir } from "@/mocks/storage"

/**
 * Bloques de disponibilidad con fecha concreta, mutable. `idUsuario`
 * coincide con las cuentas demo administrativas: 1 = Carlos Andrés Ruiz
 * (Coordinador), 4 = María López (Empleado). El emprendedor puede agendar
 * contra la agenda de cualquier miembro del equipo con disponibilidad.
 */
export const AGENDA: Agenda[] = persistir("agenda", [
  { idAgenda: 1, idUsuario: "1", fecha: "2026-09-21", horaInicio: "09:00", horaFin: "10:00", estado: "disponible" },
  { idAgenda: 2, idUsuario: "1", fecha: "2026-09-21", horaInicio: "10:00", horaFin: "11:00", estado: "disponible" },
  { idAgenda: 3, idUsuario: "1", fecha: "2026-09-19", horaInicio: "10:00", horaFin: "11:00", estado: "reservado" },
  { idAgenda: 4, idUsuario: "1", fecha: "2026-09-23", horaInicio: "14:00", horaFin: "15:00", estado: "disponible" },
  { idAgenda: 5, idUsuario: "1", fecha: "2026-09-23", horaInicio: "15:00", horaFin: "16:00", estado: "bloqueado" },
  { idAgenda: 6, idUsuario: "1", fecha: "2026-09-25", horaInicio: "09:00", horaFin: "10:00", estado: "disponible" },
  { idAgenda: 7, idUsuario: "4", fecha: "2026-09-22", horaInicio: "08:00", horaFin: "09:00", estado: "disponible" },
  { idAgenda: 8, idUsuario: "4", fecha: "2026-09-24", horaInicio: "16:00", horaFin: "17:00", estado: "disponible" },
])
