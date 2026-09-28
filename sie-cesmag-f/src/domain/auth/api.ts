import { apiClient } from "@/lib/api-client"
import type {
  Credenciales,
  RestablecimientoContrasena,
  SesionUsuario,
  SolicitudRecuperacion,
} from "@/domain/auth/types"

export async function iniciarSesion(credenciales: Credenciales): Promise<SesionUsuario> {
  const { data } = await apiClient.post<SesionUsuario>("/auth/login", credenciales)
  return data
}

export async function solicitarRecuperacion(payload: SolicitudRecuperacion): Promise<void> {
  await apiClient.post("/auth/recuperar-password", payload)
}

export async function restablecerContrasena(payload: RestablecimientoContrasena): Promise<void> {
  await apiClient.post("/auth/restablecer-password", payload)
}
