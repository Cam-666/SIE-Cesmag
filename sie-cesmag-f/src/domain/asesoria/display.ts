import type { AsesoriaListado, EstadoAsesoria, ModalidadAsesoria } from "@/domain/asesoria/types"

export const ESTADO_ASESORIA_BADGE: Record<
  EstadoAsesoria,
  { label: string; variant: "default" | "destructive" | "secondary" | "outline" }
> = {
  programada: { label: "Programada", variant: "default" },
  completada: { label: "Completada", variant: "secondary" },
  cancelada: { label: "Cancelada", variant: "destructive" },
  no_realizada: { label: "No realizada", variant: "outline" },
}

export const MODALIDAD_LABEL: Record<ModalidadAsesoria, string> = {
  presencial: "Presencial",
  virtual: "Virtual",
}

/**
 * Una asesoría "programada" cuya fecha ya pasó necesita que el
 * coordinador/empleado registre qué ocurrió: si se realizó (avance) o no
 * (motivo, como evidencia).
 */
export function requiereRegistrarResultado(asesoria: Pick<AsesoriaListado, "estadoAsesoria" | "fechaAsesoria">) {
  return asesoria.estadoAsesoria === "programada" && new Date(asesoria.fechaAsesoria) <= new Date()
}
