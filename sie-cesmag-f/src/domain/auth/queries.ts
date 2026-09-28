import { useMutation } from "@tanstack/react-query"
import {
  iniciarSesion,
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

/** Envía el enlace de restablecimiento de contraseña. */
export function useSolicitarRecuperacionMutation() {
  return useMutation({ mutationFn: solicitarRecuperacion })
}

/** Define la nueva contraseña desde el enlace recibido. */
export function useRestablecerContrasenaMutation() {
  return useMutation({ mutationFn: restablecerContrasena })
}
