import type { FechaISO, Id } from "@/types/common"

/**
 * Tipo de notificación: no es un campo explícito de la tabla NOTIFICACION en
 * el ER, se infiere del contenido para diferenciar ícono y acción en el
 * centro de notificaciones del frontend.
 */
export type TipoNotificacion =
  | "inactividad"
  | "agendamiento_asesoria"
  | "recordatorio_asesoria"
  | "recordatorio_entregable"
  | "resultado_revision"

/** Entidad NOTIFICACION (ER). */
export interface Notificacion {
  idNotificacion: Id
  idAsesoria: Id | null
  tipo: TipoNotificacion
  mensaje: string
  leido: boolean
  fechaCreacion: FechaISO
}
