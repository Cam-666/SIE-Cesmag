import type { EstadoActividad, EstadoEntregableEmprendedor, EstadoRevision } from "@/domain/entregable/types"

export const ESTADO_ACTIVIDAD_BADGE: Record<
  EstadoActividad,
  { label: string; variant: "default" | "destructive" | "secondary" | "outline" }
> = {
  pendiente: { label: "Pendiente", variant: "outline" },
  entregado: { label: "Entregado", variant: "secondary" },
  no_entregado: { label: "No entregado", variant: "destructive" },
}

export const ESTADO_REVISION_BADGE: Record<
  EstadoRevision,
  { label: string; variant: "default" | "destructive" | "secondary" | "outline" }
> = {
  pendiente: { label: "Pendiente de revisión", variant: "outline" },
  aprobado: { label: "Aprobado", variant: "default" },
  rechazado: { label: "Rechazado", variant: "destructive" },
}

/** Estado combinado, tal como lo ve el emprendedor. */
export const ESTADO_ENTREGABLE_EMPRENDEDOR_BADGE: Record<
  EstadoEntregableEmprendedor,
  { label: string; variant: "default" | "destructive" | "secondary" | "outline" }
> = {
  aprobado: { label: "Aprobado", variant: "default" },
  en_revision: { label: "En revisión", variant: "outline" },
  pendiente: { label: "Pendiente", variant: "secondary" },
  no_entregado: { label: "No entregado", variant: "destructive" },
}

/**
 * Estado de aprobación combinado, tal como lo ve el coordinador/empleado en
 * el listado y la revisión de entregables: distingue "nunca se cargó
 * evidencia" de "hay una evidencia pendiente de revisión".
 */
export type EstadoAprobacionEntregable = "no_entregado" | "pendiente_revision" | "aprobado" | "rechazado"

export function estadoAprobacionDe(estadoRevision: EstadoRevision | null): EstadoAprobacionEntregable {
  if (estadoRevision === "aprobado") return "aprobado"
  if (estadoRevision === "rechazado") return "rechazado"
  if (estadoRevision === "pendiente") return "pendiente_revision"
  return "no_entregado"
}

export const ESTADO_APROBACION_ENTREGABLE_BADGE: Record<
  EstadoAprobacionEntregable,
  { label: string; variant: "default" | "destructive" | "secondary" | "outline" }
> = {
  no_entregado: { label: "No entregado aún", variant: "outline" },
  pendiente_revision: { label: "Pendiente de revisión", variant: "secondary" },
  aprobado: { label: "Aprobado", variant: "default" },
  rechazado: { label: "Rechazado", variant: "destructive" },
}
