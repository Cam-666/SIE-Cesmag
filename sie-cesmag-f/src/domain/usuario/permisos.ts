import type { AccionPermiso, ModuloAdmin, PermisoModulo } from "@/domain/usuario/types"

/** ¿El rol tiene habilitada `accion` sobre `modulo`? */
export function tienePermiso(
  permisos: PermisoModulo[],
  modulo: ModuloAdmin,
  accion: AccionPermiso,
): boolean {
  return permisos.some((permiso) => permiso.modulo === modulo && permiso.acciones.includes(accion))
}
