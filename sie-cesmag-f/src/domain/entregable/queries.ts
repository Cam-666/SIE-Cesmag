import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  avanzarFase,
  cargarEvidencia,
  crearEntregable,
  listarEntregables,
  listarEntregablesPorFase,
  listarMisEntregables,
  obtenerEntregable,
  revisarEntregable,
} from "@/domain/entregable/api"
import type { FiltrosEntregables } from "@/domain/entregable/types"

export function useEntregablesQuery(filtros: FiltrosEntregables) {
  return useQuery({
    queryKey: ["entregables", filtros],
    queryFn: () => listarEntregables(filtros),
    placeholderData: (data) => data,
  })
}

export function useEntregablesPorFaseQuery(
  idEmprendimiento: number | undefined,
  idFase: number | undefined,
) {
  return useQuery({
    // Bajo el prefijo "entregables" para que se invalide junto con el resto
    // de consultas de entregables al aprobar/rechazar o crear uno nuevo.
    queryKey: ["entregables", "por-fase", idEmprendimiento, idFase],
    queryFn: () => listarEntregablesPorFase(idEmprendimiento as number, idFase as number),
    enabled: idEmprendimiento !== undefined && idFase !== undefined,
  })
}

export function useEntregableQuery(idEntregable: number | undefined) {
  return useQuery({
    queryKey: ["entregables", "detalle", idEntregable],
    queryFn: () => obtenerEntregable(idEntregable as number),
    enabled: idEntregable !== undefined,
  })
}

export function useCrearEntregableMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: crearEntregable,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["entregables"] }),
  })
}

export function useRevisarEntregableMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: revisarEntregable,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["entregables"] }),
  })
}

/** Aprueba el cumplimiento de la fase y avanza a la siguiente. */
export function useAvanzarFaseMutation(idEmprendimiento: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => avanzarFase(idEmprendimiento),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emprendimientos", idEmprendimiento] })
      queryClient.invalidateQueries({ queryKey: ["entregables"] })
    },
  })
}

/** Entregables asignados al emprendedor autenticado. */
export function useMisEntregablesQuery() {
  return useQuery({ queryKey: ["entregables", "mios"], queryFn: listarMisEntregables })
}

/** Carga la evidencia de un entregable abierto. */
export function useCargarEvidenciaMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cargarEvidencia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entregables"] })
      queryClient.invalidateQueries({ queryKey: ["mi-dashboard"] })
    },
  })
}
