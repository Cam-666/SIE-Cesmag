import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { decidirPrecandidato, listarPrecandidatos } from "@/domain/formulario/api"

/** Precandidatos pendientes de aprobación. */
export function usePrecandidatosQuery() {
  return useQuery({ queryKey: ["precandidatos"], queryFn: listarPrecandidatos })
}

export function useDecidirPrecandidatoMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: decidirPrecandidato,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["precandidatos"] })
      // Aprobar crea un emprendimiento nuevo: refresca el listado general.
      queryClient.invalidateQueries({ queryKey: ["emprendimientos"] })
    },
  })
}
