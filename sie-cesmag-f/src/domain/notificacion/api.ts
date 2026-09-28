import { apiClient } from "@/lib/api-client"
import type { Notificacion } from "@/domain/notificacion/types"

/** Notificaciones del usuario autenticado. */
export async function listarNotificaciones(): Promise<Notificacion[]> {
  const { data } = await apiClient.get<Notificacion[]>("/notificaciones")
  return data
}

export async function marcarNotificacionLeida(idNotificacion: number): Promise<void> {
  await apiClient.patch(`/notificaciones/${idNotificacion}/leida`)
}

export async function marcarTodasLeidas(): Promise<void> {
  await apiClient.post("/notificaciones/marcar-todas-leidas")
}
