import { useQuery } from "@tanstack/react-query"
import {
  obtenerAvancePorFase,
  obtenerDesercionPorEtapa,
  obtenerDistribucionPorEtapa,
  obtenerEntregablesRecientes,
  obtenerProximasAsesorias,
  obtenerResumenIndicadores,
  obtenerRetencionDesercion,
  obtenerTasaAprobacionEntregables,
  obtenerTendenciaMensual,
  obtenerTiempoPermanencia,
} from "@/domain/indicadores/api"
import type { FiltroPeriodo } from "@/domain/indicadores/types"

export function useResumenIndicadoresQuery(periodo?: FiltroPeriodo) {
  return useQuery({
    queryKey: ["indicadores", "resumen", periodo],
    queryFn: () => obtenerResumenIndicadores(periodo),
  })
}

export function useDistribucionPorEtapaQuery(periodo?: FiltroPeriodo) {
  return useQuery({
    queryKey: ["indicadores", "distribucion-etapa", periodo],
    queryFn: () => obtenerDistribucionPorEtapa(periodo),
  })
}

export function useAvancePorFaseQuery(periodo?: FiltroPeriodo) {
  return useQuery({
    queryKey: ["indicadores", "avance-fase", periodo],
    queryFn: () => obtenerAvancePorFase(periodo),
  })
}

/** Desistimientos agrupados por etapa. */
export function useDesercionPorEtapaQuery(periodo?: FiltroPeriodo) {
  return useQuery({
    queryKey: ["indicadores", "desercion-etapa", periodo],
    queryFn: () => obtenerDesercionPorEtapa(periodo),
  })
}

export function useRetencionDesercionQuery(periodo?: FiltroPeriodo) {
  return useQuery({
    queryKey: ["indicadores", "retencion-desercion", periodo],
    queryFn: () => obtenerRetencionDesercion(periodo),
  })
}

/** Tiempo de permanencia en el proceso. */
export function useTiempoPermanenciaQuery(periodo?: FiltroPeriodo) {
  return useQuery({
    queryKey: ["indicadores", "tiempo-permanencia", periodo],
    queryFn: () => obtenerTiempoPermanencia(periodo),
  })
}

/** Ingresos y culminaciones por mes (RF-17). */
export function useTendenciaMensualQuery(periodo?: FiltroPeriodo) {
  return useQuery({
    queryKey: ["indicadores", "tendencia-mensual", periodo],
    queryFn: () => obtenerTendenciaMensual(periodo),
  })
}

/** % de entregables aprobados sobre el total ya revisado. */
export function useTasaAprobacionEntregablesQuery(periodo?: FiltroPeriodo) {
  return useQuery({
    queryKey: ["indicadores", "tasa-aprobacion-entregables", periodo],
    queryFn: () => obtenerTasaAprobacionEntregables(periodo),
  })
}

export function useProximasAsesoriasQuery() {
  return useQuery({
    queryKey: ["dashboard", "proximas-asesorias"],
    queryFn: obtenerProximasAsesorias,
  })
}

export function useEntregablesRecientesQuery() {
  return useQuery({
    queryKey: ["dashboard", "entregables-recientes"],
    queryFn: obtenerEntregablesRecientes,
  })
}
