import type { FechaISO, Id } from "@/types/common"
import type { CaracterizacionEmprendimiento } from "@/domain/emprendimiento/types"

/** Filtro derivado de la pregunta de interés en acompañamiento de la encuesta. */
export type FiltroInicial = "interesado" | "no_interesado"

/** Estado de aprobación del precandidato. */
export type EstadoAprobacionFormulario = "pendiente" | "aprobado" | "rechazado"

/** Entidad FORMULARIO (ER): registro de caracterización / precandidato. */
export interface Formulario {
  idFormulario: Id
  idUsuario: Id | null
  fechaRespuesta: FechaISO
  filtroInicial: FiltroInicial
  estadoAprobacion: EstadoAprobacionFormulario
  respuestas?: Respuesta[]
}

export type TipoPregunta = "texto" | "numero" | "seleccion_unica" | "seleccion_multiple"

/** Entidad PREGUNTA (ER). */
export interface Pregunta {
  idPregunta: Id
  bloque: number
  orden: number
  texto: string
  tipo: TipoPregunta
  obligatoria: boolean
}

/** Entidad RESPUESTA (ER). */
export interface Respuesta {
  idRespuesta: Id
  idFormulario: Id
  idPregunta: Id
  pregunta?: Pregunta
  textoLibre: string | null
  valorNumero: number | null
  esOtro: boolean | null
}

/**
 * Proyección resuelta para el listado de precandidatos pendientes de
 * aprobación. Reduce las respuestas del formulario de caracterización a los
 * campos que el coordinador necesita para decidir, sin renderizar la
 * encuesta completa pregunta por pregunta. `programaAcademico` /
 * `semestre` / `jornada` / `fechaNacimiento` se muestran aparte porque, al
 * aprobar, van a `Emprendedor` y no a `caracterizacion`.
 */
export interface PrecandidatoListado {
  idFormulario: Id
  nombre: string
  correo: string
  numeroIdentificacion: string
  fechaRespuesta: FechaISO
  nombreEmprendimientoPropuesto: string | null
  sectorPropuesto: string | null
  descripcionPropuesta: string | null
  programaAcademico: string | null
  semestre: number | null
  jornada: string | null
  fechaNacimiento: FechaISO | null
  /** Caracterización del negocio respondida en el formulario, pasa a "Información adicional" al aprobar. */
  caracterizacion: CaracterizacionEmprendimiento
}

/** Decisión del administrador sobre un precandidato. */
export interface DecisionPrecandidatoPayload {
  idFormulario: Id
  decision: "aprobado" | "rechazado"
}

/** Resultado de aprobar o rechazar. */
export type DecisionPrecandidatoResultado =
  | { emprendimientoCreado: false }
  | { emprendimientoCreado: true; idEmprendimiento: Id }
