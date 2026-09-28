import type { EstadoAgenda } from "@/domain/agenda/types"

/** Estado de un bloque tal como lo ve el emprendedor al agendar. */
export const ESTADO_AGENDA_BADGE: Record<
  EstadoAgenda,
  { label: string; variant: "default" | "destructive" | "secondary" | "outline" }
> = {
  disponible: { label: "Disponible", variant: "default" },
  reservado: { label: "Agendado", variant: "secondary" },
  bloqueado: { label: "No disponible", variant: "outline" },
}
