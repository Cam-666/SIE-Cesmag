import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  agendarAsesoria,
  cancelarOReprogramarAsesoria,
  crearAsesoria,
  eliminarAsesoria,
  listarAsesorias,
  listarAsesoriasPorEmprendimiento,
  listarMisAsesorias,
  registrarResultadoAsesoria,
} from "@/domain/asesoria/api"
import type { FiltrosAsesorias } from "@/domain/asesoria/types"

export function useAsesoriasPorEmprendimientoQuery(idEmprendimiento: number | undefined) {
  return useQuery({
    queryKey: ["emprendimientos", idEmprendimiento, "asesorias"],
    queryFn: () => listarAsesoriasPorEmprendimiento(idEmprendimiento as number),
    enabled: idEmprendimiento !== undefined,
  })
}

export function useAsesoriasQuery(filtros: FiltrosAsesorias) {
  return useQuery({
    queryKey: ["asesorias", filtros],
    queryFn: () => listarAsesorias(filtros),
    placeholderData: (data) => data,
  })
}

export function useCrearAsesoriaMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: crearAsesoria,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asesorias"] })
      queryClient.invalidateQueries({ queryKey: ["agenda"] })
    },
  })
}

export function useCancelarReprogramarMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cancelarOReprogramarAsesoria,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asesorias"] })
      queryClient.invalidateQueries({ queryKey: ["agenda"] })
    },
  })
}

/** Registrar lo ocurrido en una asesoría ya programada, una vez pasada su fecha. */
export function useRegistrarResultadoMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: registrarResultadoAsesoria,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["asesorias"] }),
  })
}

/** Eliminar del registro una asesoría ya cancelada. */
export function useEliminarAsesoriaMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: eliminarAsesoria,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["asesorias"] }),
  })
}

/** Asesorías del emprendimiento del emprendedor autenticado. */
export function useMisAsesoriasQuery() {
  return useQuery({ queryKey: ["asesorias", "mias"], queryFn: listarMisAsesorias })
}

/** El emprendedor agenda dentro de un bloque disponible. */
export function useAgendarAsesoriaMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: agendarAsesoria,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asesorias"] })
      queryClient.invalidateQueries({ queryKey: ["agenda"] })
      queryClient.invalidateQueries({ queryKey: ["mi-dashboard"] })
    },
  })
}
