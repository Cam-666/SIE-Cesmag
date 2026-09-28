import { apiClient } from "@/lib/api-client"
import type {
  AgendarAsesoriaPayload,
  AsesoriaHistorialItem,
  AsesoriaListado,
  CancelarReprogramarPayload,
  FiltrosAsesorias,
  NuevaAsesoriaPayload,
  RegistrarResultadoAsesoriaPayload,
} from "@/domain/asesoria/types"

/** Historial de asesorías de un emprendimiento. */
export async function listarAsesoriasPorEmprendimiento(
  idEmprendimiento: number,
): Promise<AsesoriaHistorialItem[]> {
  const { data } = await apiClient.get<AsesoriaHistorialItem[]>(
    `/emprendimientos/${idEmprendimiento}/asesorias`,
  )
  return data
}

/** Listado general de asesorías (wireframe "Asesorías > Listado"). */
export async function listarAsesorias(
  filtros: FiltrosAsesorias = {},
): Promise<AsesoriaListado[]> {
  const { data } = await apiClient.get<AsesoriaListado[]>("/asesorias", { params: filtros })
  return data
}

/** Agenda una nueva asesoría dentro de un bloque disponible. */
export async function crearAsesoria(payload: NuevaAsesoriaPayload): Promise<AsesoriaListado> {
  const { data } = await apiClient.post<AsesoriaListado>("/asesorias", payload)
  return data
}

/** Cancela o reprograma una asesoría programada. */
export async function cancelarOReprogramarAsesoria(
  payload: CancelarReprogramarPayload,
): Promise<AsesoriaListado> {
  const { data } = await apiClient.patch<AsesoriaListado>(
    `/asesorias/${payload.idAsesoria}`,
    payload,
  )
  return data
}

/** Asesorías del emprendimiento del emprendedor autenticado. */
export async function listarMisAsesorias(): Promise<AsesoriaListado[]> {
  const { data } = await apiClient.get<AsesoriaListado[]>("/mi/asesorias")
  return data
}

/** Agendar dentro de un horario disponible; queda confirmada de inmediato. */
export async function agendarAsesoria(payload: AgendarAsesoriaPayload): Promise<AsesoriaListado> {
  const { data } = await apiClient.post<AsesoriaListado>("/mi/asesorias", payload)
  return data
}

/** Eliminar del registro una asesoría ya cancelada (limpieza del listado del coordinador/empleado). */
export async function eliminarAsesoria(idAsesoria: number): Promise<void> {
  await apiClient.delete(`/asesorias/${idAsesoria}`)
}

/** Registrar lo ocurrido en una asesoría ya programada, una vez pasada su fecha. */
export async function registrarResultadoAsesoria(
  payload: RegistrarResultadoAsesoriaPayload,
): Promise<AsesoriaListado> {
  const { data } = await apiClient.patch<AsesoriaListado>(
    `/asesorias/${payload.idAsesoria}/resultado`,
    payload,
  )
  return data
}
