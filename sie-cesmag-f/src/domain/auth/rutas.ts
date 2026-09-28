import type { AmbitoRol } from "@/domain/usuario/types"

/** Portal al que redirige el login según el ámbito del rol. */
export function rutaPortal(ambito: AmbitoRol): string {
  return ambito === "admin" ? "/admin" : "/emprendedor"
}
