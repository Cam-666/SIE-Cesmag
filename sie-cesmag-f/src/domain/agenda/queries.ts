import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  cambiarEstadoBloqueAgenda,
  crearBloqueAgenda,
  eliminarBloqueAgenda,
  listarAgendaAsesor,
  listarMiAgenda,
} from "@/domain/agenda/api"
import type { EstadoAgenda } from "@/domain/agenda/types"

/**
 * Bloques de disponibilidad propios del asesor autenticado — el backend la
 * protege con un permiso del portal admin (`asesorias`/`ver`), así que una
 * sesión del portal del emprendedor (sin matriz de permisos) siempre recibe
 * 403. `enabled` existe para que un componente compartido entre ambos
 * portales (ver `AsesoriaAccionesDialog`) pueda desactivarla por completo en
 * vez de dispararla igual y reintentarla varias veces contra un 403 seguro.
 */
export function useMiAgendaQuery(enabled = true) {
  return useQuery({
    queryKey: ["agenda", "mia"],
    queryFn: listarMiAgenda,
    enabled,
    // Un bloque puede reservarse desde otra sesión mientras esta pantalla
    // sigue abierta — sin esto, "disponible" queda desactualizado hasta 30s
    // (el staleTime global) y agendar sobre él falla con un 409 que se ve
    // como "no está disponible" aunque en la lista sí lo pareciera.
    staleTime: 10_000,
    refetchOnWindowFocus: true,
  })
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
  return useQuery({
    queryKey: ["agenda", "asesor"],
    queryFn: listarAgendaAsesor,
    staleTime: 10_000,
    refetchOnWindowFocus: true,
  })
}
