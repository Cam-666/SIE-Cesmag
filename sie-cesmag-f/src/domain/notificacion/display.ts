// Qué ícono mostrar en el centro de notificaciones según el tipo — la única
// pieza de presentación que necesita este dominio, todo lo demás (mensaje,
// fecha, leído/no leído) ya viene resuelto desde el backend.
import {
  AlertTriangle,
  CalendarCheck,
  CalendarClock,
  ClipboardCheck,
  FileClock,
  FileUp,
  type LucideIcon,
} from "lucide-react"
import type { TipoNotificacion } from "@/domain/notificacion/types"

export const NOTIFICACION_ICONO: Record<TipoNotificacion, LucideIcon> = {
  inactividad: AlertTriangle,
  agendamiento_asesoria: CalendarCheck,
  recordatorio_asesoria: CalendarClock,
  recordatorio_entregable: FileClock,
  resultado_revision: ClipboardCheck,
  entrega_recibida: FileUp,
}
