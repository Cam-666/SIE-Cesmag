import { apiClient } from "@/lib/api-client"
import type {
  AvancePorFase,
  DesercionPorEtapa,
  DistribucionPorEtapa,
  EntregableRecienteResumen,
  FiltroPeriodo,
  ProximaAsesoriaResumen,
  ResumenIndicadores,
  RetencionDesercion,
  TiempoPermanencia,
} from "@/domain/indicadores/types"

/** `periodo` es opcional: permite acotar los resultados a un rango de fechas. */
export async function obtenerResumenIndicadores(
  periodo?: FiltroPeriodo,
): Promise<ResumenIndicadores> {
  const { data } = await apiClient.get<ResumenIndicadores>("/indicadores/resumen", {
    params: periodo,
  })
  return data
}

export async function obtenerDistribucionPorEtapa(
  periodo?: FiltroPeriodo,
): Promise<DistribucionPorEtapa[]> {
  const { data } = await apiClient.get<DistribucionPorEtapa[]>("/indicadores/distribucion-etapa", {
    params: periodo,
  })
  return data
}

export async function obtenerAvancePorFase(periodo?: FiltroPeriodo): Promise<AvancePorFase[]> {
  const { data } = await apiClient.get<AvancePorFase[]>("/indicadores/avance-fase", {
    params: periodo,
  })
  return data
}

/** Desistimientos agrupados por etapa. */
export async function obtenerDesercionPorEtapa(
  periodo?: FiltroPeriodo,
): Promise<DesercionPorEtapa[]> {
  const { data } = await apiClient.get<DesercionPorEtapa[]>("/indicadores/desercion-etapa", {
    params: periodo,
  })
  return data
}

export async function obtenerRetencionDesercion(
  periodo?: FiltroPeriodo,
): Promise<RetencionDesercion> {
  const { data } = await apiClient.get<RetencionDesercion>("/indicadores/retencion-desercion", {
    params: periodo,
  })
  return data
}

/** Tiempo de permanencia en el proceso. */
export async function obtenerTiempoPermanencia(
  periodo?: FiltroPeriodo,
): Promise<TiempoPermanencia> {
  const { data } = await apiClient.get<TiempoPermanencia>("/indicadores/tiempo-permanencia", {
    params: periodo,
  })
  return data
}

export async function obtenerProximasAsesorias(): Promise<ProximaAsesoriaResumen[]> {
  const { data } = await apiClient.get<ProximaAsesoriaResumen[]>("/dashboard/proximas-asesorias")
  return data
}

export async function obtenerEntregablesRecientes(): Promise<EntregableRecienteResumen[]> {
  const { data } = await apiClient.get<EntregableRecienteResumen[]>(
    "/dashboard/entregables-recientes",
  )
  return data
}
