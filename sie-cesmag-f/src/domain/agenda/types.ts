import type { Id } from "@/types/common"

/** Estado de un bloque de disponibilidad del asesor. */
export type EstadoAgenda = "disponible" | "reservado" | "bloqueado"

/** Entidad AGENDA (ER): bloque de disponibilidad configurado por el asesor, con fecha concreta. */
export interface Agenda {
  idAgenda: Id
  /** UUID de Supabase Auth (mismo formato que `Usuario.idUsuario`), no un `Id` autoincremental. */
  idUsuario: string
  fecha: string
  horaInicio: string
  horaFin: string
  estado: EstadoAgenda
  /** Solo cuando `estado` es "reservado": nombre del emprendimiento que ocupa el bloque. */
  emprendimiento?: string | null
  /** Solo en listados que combinan la agenda de varios asesores: quién es dueño del bloque. */
  asesorNombre?: string
}

/** Nuevo bloque de disponibilidad con fecha concreta (no recurrente). */
export interface NuevoBloqueAgendaPayload {
  fecha: string
  horaInicio: string
  horaFin: string
}
