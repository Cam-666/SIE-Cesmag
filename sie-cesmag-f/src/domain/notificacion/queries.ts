// Hooks de React Query del centro de notificaciones (la campana del header,
// compartida entre ambos portales — ver components/shared/NotificacionesPopover.tsx).
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  listarNotificaciones,
  marcarNotificacionLeida,
  marcarTodasLeidas,
} from "@/domain/notificacion/api"
import type { Notificacion } from "@/domain/notificacion/types"

const CLAVE = ["notificaciones"]

export function useNotificacionesQuery() {
  return useQuery({
    queryKey: CLAVE,
    queryFn: listarNotificaciones,
    // Sin websockets: un refresco periódico simple mantiene la campana al día.
    refetchInterval: 60_000,
  })
}

/**
 * Marca como leída al instante en caché (no espera la respuesta del
 * servidor) — así el punto rojo desaparece de inmediato al hacer clic, en
 * vez de depender de que el refetch llegue a tiempo. Si la petición termina
 * fallando, se revierte al listado anterior y se avisa con un toast en el
 * componente (antes fallaba en silencio: sin `onError` no había ninguna
 * señal de que algo salió mal).
 */
export function useMarcarLeidaMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: marcarNotificacionLeida,
    onMutate: async (idNotificacion: number) => {
      await queryClient.cancelQueries({ queryKey: CLAVE })
      const anterior = queryClient.getQueryData<Notificacion[]>(CLAVE)
      queryClient.setQueryData<Notificacion[]>(CLAVE, (actual) =>
        actual?.map((n) => (n.idNotificacion === idNotificacion ? { ...n, leido: true } : n)),
      )
      return { anterior }
    },
    onError: (_err, _idNotificacion, contexto) => {
      if (contexto?.anterior) queryClient.setQueryData(CLAVE, contexto.anterior)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: CLAVE }),
  })
}

/** Mismo criterio optimista que `useMarcarLeidaMutation`, para las todas a la vez. */
export function useMarcarTodasLeidasMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: marcarTodasLeidas,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: CLAVE })
      const anterior = queryClient.getQueryData<Notificacion[]>(CLAVE)
      queryClient.setQueryData<Notificacion[]>(CLAVE, (actual) => actual?.map((n) => ({ ...n, leido: true })))
      return { anterior }
    },
    onError: (_err, _vars, contexto) => {
      if (contexto?.anterior) queryClient.setQueryData(CLAVE, contexto.anterior)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: CLAVE }),
  })
}
