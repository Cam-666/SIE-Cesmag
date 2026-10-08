import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { rutaPortal } from "@/domain/auth/rutas"
import { tienePermiso } from "@/domain/usuario/permisos"
import type { AmbitoRol, ModuloAdmin } from "@/domain/usuario/types"
import { useAuthStore } from "@/stores/auth-store"

/** Protege las rutas de un portal: exige sesión y el ámbito correcto. */
export function RequireAuth({ ambito, children }: { ambito: AmbitoRol; children: ReactNode }) {
  const sesion = useAuthStore((state) => state.sesion)

  if (!sesion) return <Navigate to="/login" replace />
  if (sesion.ambito !== ambito) return <Navigate to={rutaPortal(sesion.ambito)} replace />

  return <>{children}</>
}

/**
 * Protege una ruta de un módulo del portal admin según la matriz de
 * permisos — sin esto, alguien sin permiso de "ver" un módulo (p. ej.
 * Usuarios y Roles) igual podía entrar escribiendo la URL directamente,
 * aunque el enlace del sidebar estuviera oculto.
 */
export function RequirePermiso({ modulo, children }: { modulo: ModuloAdmin; children: ReactNode }) {
  const permisos = useAuthStore((state) => state.sesion?.permisos ?? [])
  // "Mi perfil" no tiene guard propio — es el único destino seguro para
  // alguien sin ningún permiso (el rol reservado "Sin rol"), evita un
  // redirect en bucle contra otro módulo que tampoco pueda ver.
  if (!tienePermiso(permisos, modulo, "ver")) return <Navigate to="/admin/mi-perfil" replace />

  return <>{children}</>
}

/** Evita que un usuario ya autenticado vuelva a ver /login. */
export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const sesion = useAuthStore((state) => state.sesion)

  if (sesion) return <Navigate to={rutaPortal(sesion.ambito)} replace />

  return <>{children}</>
}
