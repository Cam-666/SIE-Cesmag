import { apiClient } from "@/lib/api-client"
import type {
  CargarEvidenciaPayload,
  EntregableComoResponsable,
  EntregableDetalle,
  EntregableListado,
  FiltrosEntregables,
  MiEntregableListado,
  NuevoEntregablePayload,
  RevisarEntregablePayload,
} from "@/domain/entregable/types"

/** Listado general de entregables. */
export async function listarEntregables(
  filtros: FiltrosEntregables = {},
): Promise<EntregableListado[]> {
  const { data } = await apiClient.get<EntregableListado[]>("/entregables", { params: filtros })
  return data
}

/** Entregables de una fase específica de un emprendimiento (drill-down de la ruta). */
export async function listarEntregablesPorFase(
  idEmprendimiento: number,
  idFase: number,
): Promise<EntregableListado[]> {
  const { data } = await apiClient.get<EntregableListado[]>(
    `/emprendimientos/${idEmprendimiento}/fases/${idFase}/entregables`,
  )
  return data
}

/** Entregables de las etapas donde el usuario administrativo autenticado es responsable — para "Mi calendario". */
export async function listarEntregablesComoResponsable(): Promise<EntregableComoResponsable[]> {
  const { data } = await apiClient.get<EntregableComoResponsable[]>("/entregables/mios")
  return data
}

export async function obtenerEntregable(idEntregable: number): Promise<EntregableDetalle> {
  const { data } = await apiClient.get<EntregableDetalle>(`/entregables/${idEntregable}`)
  return data
}

/**
 * El archivo vive en un bucket privado de Supabase Storage: no hay una URL
 * pública fija para abrirlo, se pide una firmada (vence a los pocos
 * minutos) justo antes de mostrarlo.
 */
export async function obtenerUrlEvidencia(idEntregable: number): Promise<string> {
  const { data } = await apiClient.get<{ url: string }>(`/entregables/${idEntregable}/evidencia-url`)
  return data.url
}

/** Registra un entregable asignado a un emprendimiento y fase. */
export async function crearEntregable(payload: NuevoEntregablePayload): Promise<EntregableListado> {
  const { data } = await apiClient.post<EntregableListado>("/entregables", payload)
  return data
}

/** Registra la decisión como un nuevo intento revisado. */
export async function revisarEntregable(
  payload: RevisarEntregablePayload,
): Promise<EntregableDetalle> {
  const { data } = await apiClient.patch<EntregableDetalle>(
    `/entregables/${payload.idEntregable}/revision`,
    payload,
  )
  return data
}

/** Aprueba el cumplimiento de la fase y avanza a la siguiente. */
export async function avanzarFase(idEmprendimiento: number): Promise<void> {
  await apiClient.post(`/emprendimientos/${idEmprendimiento}/avanzar-fase`)
}

/** Entregables asignados al emprendimiento del emprendedor autenticado. */
export async function listarMisEntregables(): Promise<MiEntregableListado[]> {
  const { data } = await apiClient.get<MiEntregableListado[]>("/mi/entregables")
  return data
}

/** Carga la evidencia de un entregable abierto — el archivo sube al backend, que lo reenvía a Google Drive. */
export async function cargarEvidencia(payload: CargarEvidenciaPayload): Promise<EntregableDetalle> {
  const formulario = new FormData()
  formulario.append("archivo", payload.archivo)
  if (payload.comentario) formulario.append("comentario", payload.comentario)

  const { data } = await apiClient.post<EntregableDetalle>(
    `/mi/entregables/${payload.idEntregable}/evidencia`,
    formulario,
  )
  return data
}

/** Retracta la entrega mientras sigue pendiente de revisión, para poder volver a cargarla. */
export async function eliminarIntentoPendiente(idEntregable: number): Promise<EntregableDetalle> {
  const { data } = await apiClient.delete<EntregableDetalle>(`/mi/entregables/${idEntregable}/evidencia`)
  return data
}
