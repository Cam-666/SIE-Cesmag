import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  cambiarEstadoBloqueAgenda,
  crearBloqueAgenda,
  eliminarBloqueAgenda,
  listarAgendaAsesor,
  listarMiAgenda,
} from "@/domain/agenda/api"
import type { EstadoAgenda } from "@/domain/agenda/types"

/** Bloques de disponibilidad propios del asesor autenticado. */
export function useMiAgendaQuery() {
  return useQuery({ queryKey: ["agenda", "mia"], queryFn: listarMiAgenda })
}

export function useCrearBloqueAgendaMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: crearBloqueAgenda,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agenda"] }),
  })
}

export function useEliminarBloqueAgendaMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: eliminarBloqueAgenda,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agenda"] }),
  })
}

export function useCambiarEstadoBloqueAgendaMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ idAgenda, estado }: { idAgenda: number; estado: Extract<EstadoAgenda, "disponible" | "bloqueado"> }) =>
      cambiarEstadoBloqueAgenda(idAgenda, estado),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agenda"] }),
  })
}

/** Agenda completa del asesor, para que el emprendedor agende. */
export function useAgendaAsesorQuery() {
  return useQuery({ queryKey: ["agenda", "asesor"], queryFn: listarAgendaAsesor })
}
