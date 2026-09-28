import { apiClient } from "@/lib/api-client"
import type { DashboardEmprendedor, EditarPerfilPayload, Emprendedor } from "@/domain/emprendedor/types"

/** Datos personales del emprendedor autenticado. */
export async function obtenerMiPerfil(): Promise<Emprendedor> {
  const { data } = await apiClient.get<Emprendedor>("/mi/perfil")
  return data
}

/** Edita los datos de contacto del emprendedor autenticado. */
export async function editarMiPerfil(payload: EditarPerfilPayload): Promise<Emprendedor> {
  const { data } = await apiClient.patch<Emprendedor>("/mi/perfil", payload)
  return data
}

/** Resumen del dashboard del portal del emprendedor. */
export async function obtenerMiDashboard(): Promise<DashboardEmprendedor> {
  const { data } = await apiClient.get<DashboardEmprendedor>("/mi/dashboard")
  return data
}
