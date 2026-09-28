import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  listarNotificaciones,
  marcarNotificacionLeida,
  marcarTodasLeidas,
} from "@/domain/notificacion/api"

export function useNotificacionesQuery() {
  return useQuery({
    queryKey: ["notificaciones"],
    queryFn: listarNotificaciones,
    // Sin websockets: un refresco periódico simple mantiene la campana al día.
    refetchInterval: 60_000,
  })
}

export function useMarcarLeidaMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: marcarNotificacionLeida,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notificaciones"] }),
  })
}

export function useMarcarTodasLeidasMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: marcarTodasLeidas,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notificaciones"] }),
  })
}
