import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  asignarResponsable,
  crearUsuario,
  editarMiPerfilAdmin,
  editarUsuario,
  eliminarResponsable,
  eliminarRol,
  eliminarUsuario,
  guardarRol,
  listarResponsablesPorEtapa,
  listarRoles,
  listarUsuarios,
  obtenerMiPerfilAdmin,
} from "@/domain/usuario/api"

export function useUsuariosQuery() {
  return useQuery({ queryKey: ["usuarios"], queryFn: listarUsuarios })
}

export function useRolesQuery() {
  return useQuery({ queryKey: ["roles"], queryFn: listarRoles })
}

export function useResponsablesPorEtapaQuery() {
  return useQuery({ queryKey: ["etapas", "responsables"], queryFn: listarResponsablesPorEtapa })
}

/** Crea un nuevo usuario administrativo. */
export function useCrearUsuarioMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: crearUsuario,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["usuarios"] }),
  })
}

/** Actualiza el rol o estado de un usuario. */
export function useEditarUsuarioMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: editarUsuario,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["usuarios"] }),
  })
}

/** Elimina un usuario administrativo. */
export function useEliminarUsuarioMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: eliminarUsuario,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["usuarios"] }),
  })
}

/** Crea o edita un rol y su matriz de permisos. */
export function useGuardarRolMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: guardarRol,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] })
      queryClient.invalidateQueries({ queryKey: ["usuarios"] })
    },
  })
}

/** Elimina un rol (reasigna primero a los usuarios que lo tengan, si aplica). */
export function useEliminarRolMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: eliminarRol,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] })
      queryClient.invalidateQueries({ queryKey: ["usuarios"] })
    },
  })
}

/** Asigna un responsable a una etapa. */
export function useAsignarResponsableMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: asignarResponsable,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["etapas", "responsables"] }),
  })
}

/** Quita la asignación de responsable de una etapa. */
export function useEliminarResponsableMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: eliminarResponsable,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["etapas", "responsables"] }),
  })
}

/** "Mi perfil" del portal admin. */
export function useMiPerfilAdminQuery() {
  return useQuery({ queryKey: ["mi-perfil-admin"], queryFn: obtenerMiPerfilAdmin })
}

export function useEditarMiPerfilAdminMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: editarMiPerfilAdmin,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mi-perfil-admin"] }),
  })
}
