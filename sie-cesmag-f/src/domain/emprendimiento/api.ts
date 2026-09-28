import { apiClient } from "@/lib/api-client"
import type {
  CambioEstadoEmprendimiento,
  CaracterizacionEmprendimiento,
  CrearEmprendimientoPayload,
  DiagnosticoInicialPayload,
  Emprendimiento,
  EmprendimientoCreado,
  EmprendimientoDetalle,
  EmprendimientoListado,
  FiltrosEmprendimientos,
  ReingresoEmprendimiento,
} from "@/domain/emprendimiento/types"
import type { IntegranteEmprendimiento } from "@/domain/emprendedor/types"

/** Consulta de información de los emprendimientos. */
export async function listarEmprendimientos(
  filtros: FiltrosEmprendimientos = {},
): Promise<EmprendimientoListado[]> {
  const { data } = await apiClient.get<EmprendimientoListado[]>("/emprendimientos", {
    params: filtros,
  })
  return data
}

/** Información y ruta completa de un emprendimiento. */
export async function obtenerEmprendimiento(
  idEmprendimiento: number,
): Promise<EmprendimientoDetalle> {
  const { data } = await apiClient.get<EmprendimientoDetalle>(
    `/emprendimientos/${idEmprendimiento}`,
  )
  return data
}

/** Emprendimiento del emprendedor autenticado (solo lectura). */
export async function obtenerMiEmprendimiento(): Promise<EmprendimientoDetalle> {
  const { data } = await apiClient.get<EmprendimientoDetalle>("/mi/emprendimiento")
  return data
}

/** Crea un emprendimiento directamente, sin pasar por la aprobación de un precandidato. */
export async function crearEmprendimiento(
  payload: CrearEmprendimientoPayload,
): Promise<EmprendimientoCreado> {
  const { data } = await apiClient.post<EmprendimientoCreado>("/emprendimientos", payload)
  return data
}

/** Agrega un integrante a un emprendimiento existente. */
export async function agregarIntegrante(
  idEmprendimiento: number,
  numeroIdentificacion: string,
): Promise<IntegranteEmprendimiento> {
  const { data } = await apiClient.post<IntegranteEmprendimiento>(
    `/emprendimientos/${idEmprendimiento}/integrantes`,
    { numeroIdentificacion },
  )
  return data
}

/** Corrige el nombre de un integrante del emprendimiento. */
export async function editarIntegrante(
  idEmprendimiento: number,
  idUsuario: string,
  nombre: string,
): Promise<IntegranteEmprendimiento> {
  const { data } = await apiClient.patch<IntegranteEmprendimiento>(
    `/emprendimientos/${idEmprendimiento}/integrantes/${idUsuario}`,
    { nombre },
  )
  return data
}

/** Quita un integrante del emprendimiento. */
export async function eliminarIntegrante(idEmprendimiento: number, idUsuario: string): Promise<void> {
  await apiClient.delete(`/emprendimientos/${idEmprendimiento}/integrantes/${idUsuario}`)
}

/** Cambio de estado general del emprendimiento. */
export async function cambiarEstadoEmprendimiento(
  payload: CambioEstadoEmprendimiento,
): Promise<Emprendimiento> {
  const { data } = await apiClient.patch<Emprendimiento>(
    `/emprendimientos/${payload.idEmprendimiento}/estado`,
    payload,
  )
  return data
}

/** Registro de reingreso al proceso. */
export async function registrarReingreso(
  payload: ReingresoEmprendimiento,
): Promise<Emprendimiento> {
  const { data } = await apiClient.post<Emprendimiento>(
    `/emprendimientos/${payload.idEmprendimiento}/reingreso`,
    payload,
  )
  return data
}

/** Diagnóstico inicial y etapa de ingreso de un emprendimiento recién aprobado. */
export async function registrarDiagnosticoInicial(
  payload: DiagnosticoInicialPayload,
): Promise<Emprendimiento> {
  const { data } = await apiClient.post<Emprendimiento>(
    `/emprendimientos/${payload.idEmprendimiento}/diagnostico-inicial`,
    payload,
  )
  return data
}

/** Edición manual de los datos de caracterización. */
export async function editarCaracterizacion(
  idEmprendimiento: number,
  payload: CaracterizacionEmprendimiento,
): Promise<Emprendimiento> {
  const { data } = await apiClient.patch<Emprendimiento>(
    `/emprendimientos/${idEmprendimiento}/caracterizacion`,
    payload,
  )
  return data
}
