import type { Id } from "@/types/common"

/** Entidad ETAPA (ER): las 3 grandes etapas de la ruta metodológica. */
export interface Etapa {
  idEtapa: Id
  numero: number
  nombre: string
  descripcion: string | null
}

/** Entidad FASE (ER): las 12 fases distribuidas entre las etapas. */
export interface Fase {
  idFase: Id
  idEtapa: Id
  numero: number
  nombre: string
  entregablesRequeridos: string | null
}

/** Estado de una fase dentro de la ruta metodológica. */
export type EstadoFase = "pendiente" | "en_curso" | "completada"

/** Entidad EMPRENDIMIENTO_FASE (ER): ubicación de un emprendimiento en la ruta. */
export interface EmprendimientoFase {
  idEmprendimientoFase: Id
  idEmprendimiento: Id
  idFase: Id
  fase?: Fase
  fechaInicio: string
  fechaFin: string | null
  estadoFase: EstadoFase
}

/** Proyección de una fase dentro de la ruta completa de un emprendimiento (vista de detalle). */
export interface FaseRuta {
  idFase: Id
  numero: number
  nombre: string
  estadoFase: EstadoFase
  /** Entregable obligatorio de la fase según el Manual Operativo (ER: FASE.entregables_requeridos). */
  entregableRequerido: string | null
}

/** Proyección de una etapa (con sus fases) dentro de la ruta completa de un emprendimiento. */
export interface EtapaRuta {
  idEtapa: Id
  numero: number
  nombre: string
  estado: EstadoFase
  fases: FaseRuta[]
}
