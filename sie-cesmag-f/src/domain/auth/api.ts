// Llamadas HTTP crudas de autenticación (RF-14/RF-24) — sin lógica propia,
// solo el mapeo a cada endpoint. Los hooks de React Query que las usan están
// en domain/auth/queries.ts.
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

/** Perfil + permisos actuales de la sesión activa, sin `token`/`refreshToken` (no cambian). */
export async function obtenerMiSesion(): Promise<Omit<SesionUsuario, "token" | "refreshToken">> {
  const { data } = await apiClient.get<Omit<SesionUsuario, "token" | "refreshToken">>("/auth/me")
  return data
}

/** Renueva el token de acceso a partir del refresh token guardado, sin pedir contraseña de nuevo. */
export async function refrescarSesion(refreshToken: string): Promise<SesionUsuario> {
  const { data } = await apiClient.post<SesionUsuario>("/auth/refrescar", { refreshToken })
  return data
}

export async function solicitarRecuperacion(payload: SolicitudRecuperacion): Promise<void> {
  await apiClient.post("/auth/recuperar-password", payload)
}

export async function restablecerContrasena(payload: RestablecimientoContrasena): Promise<void> {
  await apiClient.post("/auth/restablecer-password", payload)
}
