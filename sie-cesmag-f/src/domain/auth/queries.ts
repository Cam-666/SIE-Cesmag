import { useEffect } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import {
  iniciarSesion,
  obtenerMiSesion,
  restablecerContrasena,
  solicitarRecuperacion,
} from "@/domain/auth/api"
import { useAuthStore } from "@/stores/auth-store"

/** Autentica al usuario y, al resolver, persiste la sesión activa. */
export function useIniciarSesionMutation() {
  const guardarSesion = useAuthStore((state) => state.iniciarSesion)

  return useMutation({
    mutationFn: iniciarSesion,
    onSuccess: (sesion) => guardarSesion(sesion),
  })
}

/**
 * Mantiene los permisos de la sesión activa al día: si alguien le cambia el
 * rol o sus permisos a esta persona desde "Usuarios y Roles" mientras ya
 * tiene la aplicación abierta, antes seguía viendo botones de acciones ya
 * revocadas hasta que cerraba e iniciaba sesión de nuevo (el backend sí las
 * rechazaba, pero con un error confuso). Se llama una sola vez por layout
 * (admin/emprendedor); si la cuenta queda inactiva, el 401 resultante ya
 * dispara el cierre de sesión automático del interceptor de `apiClient`.
 */
export function useSesionAlDia() {
  const sesion = useAuthStore((state) => state.sesion)
  const actualizarSesion = useAuthStore((state) => state.actualizarSesion)

  const { data } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: obtenerMiSesion,
    enabled: !!sesion,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  })

  useEffect(() => {
    if (data) actualizarSesion(data)
  }, [data, actualizarSesion])
}

/** Envía el enlace de restablecimiento de contraseña. */
export function useSolicitarRecuperacionMutation() {
  return useMutation({ mutationFn: solicitarRecuperacion })
}

/** Define la nueva contraseña desde el enlace recibido. */
export function useRestablecerContrasenaMutation() {
  return useMutation({ mutationFn: restablecerContrasena })
}
