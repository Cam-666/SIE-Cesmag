import {
  AlertTriangle,
  CalendarCheck,
  CalendarClock,
  ClipboardCheck,
  FileClock,
  type LucideIcon,
} from "lucide-react"
import type { TipoNotificacion } from "@/domain/notificacion/types"

export const NOTIFICACION_ICONO: Record<TipoNotificacion, LucideIcon> = {
  inactividad: AlertTriangle,
  agendamiento_asesoria: CalendarCheck,
  recordatorio_asesoria: CalendarClock,
  recordatorio_entregable: FileClock,
  resultado_revision: ClipboardCheck,
}
