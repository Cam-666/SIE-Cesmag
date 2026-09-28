import { apiClient } from "@/lib/api-client"
import type {
  AsignarResponsablePayload,
  EditarMiPerfilAdminPayload,
  EditarUsuarioPayload,
  EliminarRolPayload,
  NuevoUsuarioPayload,
  ResponsableEtapa,
  Rol,
  RolPayload,
  Usuario,
} from "@/domain/usuario/types"

/** Perfil del usuario administrativo autenticado ("Mi perfil"). */
export async function obtenerMiPerfilAdmin(): Promise<Usuario> {
  const { data } = await apiClient.get<Usuario>("/mi/perfil-admin")
  return data
}

export async function editarMiPerfilAdmin(payload: EditarMiPerfilAdminPayload): Promise<Usuario> {
  const { data } = await apiClient.patch<Usuario>("/mi/perfil-admin", payload)
  return data
}

/** Usuarios administrativos, con su rol resuelto. */
export async function listarUsuarios(): Promise<Usuario[]> {
  const { data } = await apiClient.get<Usuario[]>("/usuarios")
  return data
}

/** Crea un usuario administrativo. */
export async function crearUsuario(payload: NuevoUsuarioPayload): Promise<Usuario> {
  const { data } = await apiClient.post<Usuario>("/usuarios", payload)
  return data
}

/** Actualiza el rol o estado de un usuario. */
export async function editarUsuario(payload: EditarUsuarioPayload): Promise<Usuario> {
  const { data } = await apiClient.patch<Usuario>(`/usuarios/${payload.idUsuario}`, payload)
  return data
}

/** Elimina un usuario administrativo. */
export async function eliminarUsuario(idUsuario: number): Promise<void> {
  await apiClient.delete(`/usuarios/${idUsuario}`)
}

export async function listarRoles(): Promise<Rol[]> {
  const { data } = await apiClient.get<Rol[]>("/roles")
  return data
}

/** Crea o edita un rol y su matriz de permisos por módulo. */
export async function guardarRol(payload: RolPayload): Promise<Rol> {
  if (payload.idRol) {
    const { data } = await apiClient.patch<Rol>(`/roles/${payload.idRol}`, payload)
    return data
  }
  const { data } = await apiClient.post<Rol>("/roles", payload)
  return data
}

/**
 * Elimina un rol. Si tiene usuarios asignados, el backend exige
 * `idRolReemplazo` (mismo ámbito) y los reasigna antes de borrar el rol,
 * ya que `USUARIO.id_rol` no admite quedar vacío.
 */
export async function eliminarRol({ idRol, idRolReemplazo }: EliminarRolPayload): Promise<void> {
  await apiClient.delete(`/roles/${idRol}`, { data: { idRolReemplazo } })
}

/** Responsables asignados por etapa. */
export async function listarResponsablesPorEtapa(): Promise<ResponsableEtapa[]> {
  const { data } = await apiClient.get<ResponsableEtapa[]>("/etapas/responsables")
  return data
}

export async function asignarResponsable(payload: AsignarResponsablePayload): Promise<ResponsableEtapa> {
  const { data } = await apiClient.put<ResponsableEtapa>(
    `/etapas/${payload.idEtapa}/responsable`,
    payload,
  )
  return data
}

/** Quita la asignación de responsable de una etapa. */
export async function eliminarResponsable(idEtapa: number): Promise<void> {
  await apiClient.delete(`/etapas/${idEtapa}/responsable`)
}
