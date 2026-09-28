import { apiClient } from "@/lib/api-client"
import type { Agenda, EstadoAgenda, NuevoBloqueAgendaPayload } from "@/domain/agenda/types"

/** Bloques de disponibilidad propios del asesor autenticado (coordinador/empleado). */
export async function listarMiAgenda(): Promise<Agenda[]> {
  const { data } = await apiClient.get<Agenda[]>("/agenda/mia")
  return data
}

export async function crearBloqueAgenda(payload: NuevoBloqueAgendaPayload): Promise<Agenda> {
  const { data } = await apiClient.post<Agenda>("/agenda/mia", payload)
  return data
}

export async function eliminarBloqueAgenda(idAgenda: number): Promise<void> {
  await apiClient.delete(`/agenda/mia/${idAgenda}`)
}

/** Alterna un bloque no reservado entre "disponible" y "bloqueado" (no disponible temporalmente). */
export async function cambiarEstadoBloqueAgenda(
  idAgenda: number,
  estado: Extract<EstadoAgenda, "disponible" | "bloqueado">,
): Promise<Agenda> {
  const { data } = await apiClient.patch<Agenda>(`/agenda/mia/${idAgenda}`, { estado })
  return data
}

/** Agenda completa del asesor (todos los estados), para que el emprendedor agende. */
export async function listarAgendaAsesor(): Promise<Agenda[]> {
  const { data } = await apiClient.get<Agenda[]>("/agenda/asesor")
  return data
}
