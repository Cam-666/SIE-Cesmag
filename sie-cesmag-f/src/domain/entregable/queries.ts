import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  avanzarFase,
  cargarEvidencia,
  crearEntregable,
  eliminarIntentoPendiente,
  listarEntregables,
  listarEntregablesComoResponsable,
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
    // El estado (aprobado/rechazado) lo cambia otra persona (el admin) en
    // otra sesión — no hay forma de invalidar el cache de este usuario desde
    // ahí, así que se refresca solo mientras el diálogo está abierto.
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
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

/** Entregables de las etapas donde el usuario administrativo autenticado es responsable — para "Mi calendario". */
export function useEntregablesComoResponsableQuery() {
  return useQuery({
    queryKey: ["entregables", "mios-responsable"],
    queryFn: listarEntregablesComoResponsable,
  })
}

/** Entregables asignados al emprendedor autenticado. */
export function useMisEntregablesQuery() {
  return useQuery({
    queryKey: ["entregables", "mios"],
    queryFn: listarMisEntregables,
    // Igual que useEntregableQuery: el cambio de estado lo hace el admin en
    // otra sesión, así que hay que refrescar sin depender de una invalidación.
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  })
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

/** Retracta la entrega pendiente de revisión, para poder volver a cargarla. */
export function useEliminarIntentoPendienteMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: eliminarIntentoPendiente,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entregables"] })
      queryClient.invalidateQueries({ queryKey: ["mi-dashboard"] })
    },
  })
}
