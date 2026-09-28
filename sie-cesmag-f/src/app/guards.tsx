import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { rutaPortal } from "@/domain/auth/rutas"
import type { AmbitoRol } from "@/domain/usuario/types"
import { useAuthStore } from "@/stores/auth-store"

/** Protege las rutas de un portal: exige sesión y el ámbito correcto. */
export function RequireAuth({ ambito, children }: { ambito: AmbitoRol; children: ReactNode }) {
  const sesion = useAuthStore((state) => state.sesion)

  if (!sesion) return <Navigate to="/login" replace />
  if (sesion.ambito !== ambito) return <Navigate to={rutaPortal(sesion.ambito)} replace />

  return <>{children}</>
}

/** Evita que un usuario ya autenticado vuelva a ver /login. */
export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const sesion = useAuthStore((state) => state.sesion)

  if (sesion) return <Navigate to={rutaPortal(sesion.ambito)} replace />

  return <>{children}</>
}
