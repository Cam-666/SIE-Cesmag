import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { editarMiPerfil, obtenerMiDashboard, obtenerMiPerfil } from "@/domain/emprendedor/api"

export function useMiPerfilQuery() {
  return useQuery({ queryKey: ["mi-perfil"], queryFn: obtenerMiPerfil })
}

export function useMiDashboardQuery() {
  return useQuery({ queryKey: ["mi-dashboard"], queryFn: obtenerMiDashboard })
}

/** Edita los datos de contacto del emprendedor autenticado. */
export function useEditarMiPerfilMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: editarMiPerfil,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mi-perfil"] }),
  })
}
