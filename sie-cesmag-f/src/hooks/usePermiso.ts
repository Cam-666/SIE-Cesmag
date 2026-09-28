import { tienePermiso } from "@/domain/usuario/permisos"
import type { AccionPermiso, ModuloAdmin } from "@/domain/usuario/types"
import { useAuthStore } from "@/stores/auth-store"

/**
 * ¿El usuario autenticado puede `accion` sobre `modulo`, según la matriz de
 * permisos de su rol? Se usa en el portal admin para mostrar u ocultar los
 * botones de crear/editar/eliminar de cada módulo.
 */
export function usePermiso(modulo: ModuloAdmin, accion: AccionPermiso): boolean {
  return useAuthStore((state) => tienePermiso(state.sesion?.permisos ?? [], modulo, accion))
}
