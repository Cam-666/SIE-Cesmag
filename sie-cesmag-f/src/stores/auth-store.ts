import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type { SesionUsuario } from "@/domain/auth/types"
import { queryClient } from "@/lib/query-client"

interface AuthState {
  sesion: SesionUsuario | null
  iniciarSesion: (sesion: SesionUsuario) => void
  actualizarSesion: (cambios: Partial<SesionUsuario>) => void
  cerrarSesion: () => void
}

/**
 * Estado de sesión. Persiste en sessionStorage (no localStorage) a propósito:
 * así cada pestaña conserva su propia sesión, permitiendo por ejemplo al
 * coordinador logueado en una pestaña y al emprendedor en otra del mismo
 * navegador. El token expirado o inválido se limpia automáticamente desde
 * el interceptor de `apiClient`.
 *
 * `cerrarSesion` también limpia el caché de TanStack Query: si no, datos de
 * la cuenta anterior quedarían "fresh" por el `staleTime` configurado y se
 * mostrarían brevemente tras iniciar sesión con otra cuenta.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      sesion: null,
      iniciarSesion: (sesion) => set({ sesion }),
      // Para reflejar de inmediato un cambio hecho desde "Mi perfil" (p. ej.
      // el correo) sin forzar a la persona a volver a iniciar sesión.
      actualizarSesion: (cambios) => set((state) => (state.sesion ? { sesion: { ...state.sesion, ...cambios } } : state)),
      cerrarSesion: () => {
        set({ sesion: null })
        queryClient.clear()
      },
    }),
    { name: "sie-auth", storage: createJSONStorage(() => sessionStorage) },
  ),
)
