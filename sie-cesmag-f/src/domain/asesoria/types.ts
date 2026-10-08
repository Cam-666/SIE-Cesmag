import type { FechaISO, Id } from "@/types/common"
import type { Agenda } from "@/domain/agenda/types"

/** Tipo de asesoría: diagnóstica (primera) o de seguimiento. */
export type TipoAsesoria = "diagnostica" | "seguimiento"

export type ModalidadAsesoria = "presencial" | "virtual"

/**
 * Estados vistos en el wireframe "Listado de Asesorías". "no_realizada" se
 * registra cuando llega la fecha programada pero la asesoría no se llevó a
 * cabo (el coordinador/empleado deja evidencia del motivo en observaciones).
 */
export type EstadoAsesoria = "programada" | "completada" | "cancelada" | "no_realizada"

/** Duraciones de asesoría que tiene sentido ofrecer — igual que `DURACIONES_ASESORIA_MINUTOS` del backend. Máximo 1 hora. */
export const DURACIONES_ASESORIA_MINUTOS = [15, 30, 45, 60] as const
export type DuracionAsesoriaMinutos = (typeof DURACIONES_ASESORIA_MINUTOS)[number]

/** Actividad/compromiso asignado durante una asesoría (wireframe "Detalle de Asesoría"). */
export interface ActividadAsesoria {
  descripcion: string
  responsable: string
  cumplido: boolean
}

/** Entidad ASESORIA (ER). */
export interface Asesoria {
  idAsesoria: Id
  idEmprendimientoFase: Id
  idAgenda: Id
  agenda?: Agenda
  tipoAsesoria: TipoAsesoria
  titulo: string
  fechaAsesoria: FechaISO
  avance: string | null
  observaciones: string | null
  modalidad: ModalidadAsesoria
  estadoAsesoria: EstadoAsesoria
  actividades?: ActividadAsesoria[]
}

/**
 * Proyección resuelta para el "Histórico de Asesorías" del detalle de un
 * emprendimiento (wireframe "Emprendimientos > [nombre]").
 */
export interface AsesoriaHistorialItem {
  idAsesoria: Id
  fechaAsesoria: FechaISO
  asesor: string
  faseNombre: string
  titulo: string
  estadoAsesoria: EstadoAsesoria
  avance: string | null
  actividades: ActividadAsesoria[]
}

/** Proyección resuelta para el listado general de asesorías (wireframe "Asesorías > Listado"). */
export interface AsesoriaListado {
  idAsesoria: Id
  fechaAsesoria: FechaISO
  emprendimiento: string
  asesor: string
  tipoAsesoria: TipoAsesoria
  modalidad: ModalidadAsesoria
  estadoAsesoria: EstadoAsesoria
  avance: string | null
  observaciones: string | null
  /** Bloque de agenda del que se originó (null en registros antiguos sin agenda asociada). */
  idAgenda: Id | null
  /** Duración real de la cita (del bloque de agenda del que se originó) — para el calendario semanal. */
  duracionMinutos: number
}

export interface FiltrosAsesorias {
  estado?: EstadoAsesoria | "todos"
}

/**
 * Registrar (agendar) una asesoría dentro de un bloque disponible de la
 * propia agenda del coordinador/empleado; el avance se registra después de
 * que la asesoría ocurre (ver `RegistrarResultadoAsesoriaPayload`).
 */
export interface NuevaAsesoriaPayload {
  idEmprendimiento: Id
  idAgenda: Id
  duracionMinutos: DuracionAsesoriaMinutos
  tipoAsesoria: TipoAsesoria
  modalidad: ModalidadAsesoria
  etapaIdentificada?: number | null
}

/** Cancelar libera el bloque de agenda; reprogramar lo cambia por otro bloque disponible. */
export interface CancelarReprogramarPayload {
  idAsesoria: Id
  accion: "cancelar" | "reprogramar"
  nuevoIdAgenda?: Id
  motivo?: string
}

/** El emprendedor agenda dentro de un bloque disponible de la agenda del coordinador. */
export interface AgendarAsesoriaPayload {
  idAgenda: Id
  duracionMinutos: DuracionAsesoriaMinutos
  tipoAsesoria: TipoAsesoria
  modalidad: ModalidadAsesoria
  motivo: string
}

/**
 * Registrar lo ocurrido en una asesoría ya programada, una vez pasada su
 * fecha: si se realizó, el avance/situación actual; si no, el motivo como
 * evidencia de que no se llevó a cabo.
 */
export interface RegistrarResultadoAsesoriaPayload {
  idAsesoria: Id
  realizada: boolean
  avance?: string
  observaciones?: string
}
