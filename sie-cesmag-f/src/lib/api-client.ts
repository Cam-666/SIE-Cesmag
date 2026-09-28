import axios from "axios"
import { useAuthStore } from "@/stores/auth-store"

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

// Si el backend responde 401, la sesión ya no es válida: se limpia para
// que las guardas de ruta redirijan a /login.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().cerrarSesion()
    }
    return Promise.reject(error)
  },
)
