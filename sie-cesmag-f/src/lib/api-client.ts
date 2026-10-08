import axios, { type AxiosRequestConfig } from "axios"
import { useAuthStore } from "@/stores/auth-store"
import type { SesionUsuario } from "@/domain/auth/types"

/**
 * Instancia central de Axios. La URL base se define en `VITE_API_URL`
 * (ver .env.example); todas las llamadas API de cada módulo de dominio
 * deben consumir esta instancia en vez de crear las suyas propias.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
})

// Adjunta el token de sesión a cada petición autenticada.
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().sesion?.token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * Rutas públicas de autenticación: un 401 ahí es "credenciales inválidas" o
 * similar, no una sesión expirada — reintentar tras refrescar no tiene
 * sentido (y `/auth/refrescar` en particular causaría un bucle infinito).
 */
const RUTAS_AUTH_PUBLICAS = ["/auth/login", "/auth/refrescar", "/auth/recuperar-password", "/auth/restablecer-password"]

type ConfigConReintento = AxiosRequestConfig & { _reintentadaTrasRefresco?: boolean }

// Varias peticiones pueden fallar con 401 al mismo tiempo (p. ej. al volver
// de inactividad) — se comparte una sola renovación en curso en vez de
// disparar un refresh por cada una.
let refrescoEnCurso: Promise<string | null> | null = null

async function refrescarToken(): Promise<string | null> {
  const refreshToken = useAuthStore.getState().sesion?.refreshToken
  if (!refreshToken) return null

  try {
    // Axios "en crudo" (no `apiClient`): evita pasar de nuevo por estos
    // mismos interceptores con el token viejo todavía puesto.
    const { data } = await axios.post<SesionUsuario>(
      `${(import.meta.env.VITE_API_URL as string | undefined) ?? "/api"}/auth/refrescar`,
      { refreshToken },
    )
    useAuthStore.getState().actualizarSesion(data)
    return data.token
  } catch {
    return null
  }
}

// Si el backend responde 401 por un token de acceso vencido (dura ~1 hora
// en Supabase), se renueva solo con el refresh token guardado y se
// reintenta la petición original una vez — así una sesión abierta toda la
// jornada no empieza a fallar en silencio. Solo si el refresh token
// también falla (o no hay ninguno guardado) se cierra la sesión de verdad.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config: ConfigConReintento | undefined = error.config
    const esRutaPublica = RUTAS_AUTH_PUBLICAS.some((ruta) => config?.url?.includes(ruta))

    if (error.response?.status === 401 && config && !config._reintentadaTrasRefresco && !esRutaPublica) {
      config._reintentadaTrasRefresco = true
      refrescoEnCurso ??= refrescarToken().finally(() => {
        refrescoEnCurso = null
      })
      const nuevoToken = await refrescoEnCurso
      if (nuevoToken) {
        config.headers = { ...config.headers, Authorization: `Bearer ${nuevoToken}` }
        return apiClient(config)
      }
    }

    if (error.response?.status === 401) {
      useAuthStore.getState().cerrarSesion()
    }
    return Promise.reject(error)
  },
)
