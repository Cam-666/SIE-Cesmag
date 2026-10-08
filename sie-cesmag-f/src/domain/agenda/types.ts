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

/**
 * Nuevo rango de disponibilidad con fecha concreta (no recurrente). El
 * backend lo trocea siempre en bloques atómicos de 15 minutos — quien agenda
 * elige la duración real (ver `DURACIONES_ASESORIA_MINUTOS` en
 * `domain/asesoria/types.ts`), no el coordinador al crear el rango.
 */
export interface NuevoBloqueAgendaPayload {
  fecha: string
  horaInicio: string
  horaFin: string
}
