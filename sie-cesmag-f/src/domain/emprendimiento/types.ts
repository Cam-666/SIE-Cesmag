import type { FechaISO, Id } from "@/types/common"
import type { IntegranteEmprendimiento } from "@/domain/emprendedor/types"
import type { EmprendimientoFase, EtapaRuta } from "@/domain/ruta/types"

/** Activo = con actividad en curso; inactivo = puede reingresar; terminado = culminó la ruta. */
export type EstadoEmprendimiento = "activo" | "inactivo" | "terminado"

/**
 * Caracterización del NEGOCIO capturada por el formulario público (bloques
 * 3 a 8). El bloque 2 "Perfil del estudiante" vive en `Emprendedor`, por
 * persona, porque un emprendimiento puede tener varios integrantes.
 * `descripcion` es un campo libre sin pregunta asociada en el formulario.
 * Las preguntas de selección múltiple se guardan como texto separado por
 * comas para simplificar su edición manual.
 */
export interface CaracterizacionEmprendimiento {
  // Bloque 3 — Caracterización del emprendimiento
  sector: string | null
  origenIdea: string | null
  tipoClientes: string | null
  queOfrece: string | null
  tiempoOperando: string | null
  nivelFormalizacion: string | null
  descripcion: string | null
  // Bloque 4 — Validación y tracción
  nivelValidacion: string | null
  tieneVentas: string | null
  alcanceVentas: string | null
  situacionFinanciera: string | null
  // Bloque 5 — Madurez financiera
  registroFinanciero: string | null
  conoceCostos: string | null
  // Bloque 6 — Estructura y operación
  numeroPersonas: number | null
  canalVentas: string | null
  herramientasDigitales: string | null
  // Bloque 7 — Innovación y escalabilidad
  tipoInnovacion: string | null
  fuenteFinanciacion: string | null
  // Bloque 8 — Necesidades estratégicas
  necesidadesEstrategicas: string | null
  temasAcompanamiento: string | null
}

/** Entidad EMPRENDIMIENTO (ER). */
export interface Emprendimiento {
  idEmprendimiento: Id
  nombreReferencia: string
  estado: EstadoEmprendimiento
  motivo: string | null
  fechaIngreso: FechaISO
  fechaCulminacion: FechaISO | null
  fechaDesistimiento: FechaISO | null
  fechaReingreso: FechaISO | null
  fechaInactividad: FechaISO | null
  integrantes?: IntegranteEmprendimiento[]
  faseActual?: EmprendimientoFase
  caracterizacion: CaracterizacionEmprendimiento
  /**
   * Un precandidato recién aprobado ingresa sin etapa asignada hasta que el
   * coordinador registre el diagnóstico inicial y defina la etapa de
   * ingreso. Mientras sea `true`, la ruta metodológica no debe considerarse
   * iniciada.
   */
  diagnosticoPendiente: boolean
}

/**
 * Vista completa del detalle de un emprendimiento (pantalla "Emprendimientos
 * > [nombre]"): la entidad base más la ruta metodológica completa resuelta.
 */
export interface EmprendimientoDetalle extends Emprendimiento {
  ruta: EtapaRuta[]
  fasesCompletadas: number
  totalFases: number
  ultimaActividad: FechaISO
}

/** Registro de cambio de estado con motivo (pantalla "Gestión del estado"). */
export interface CambioEstadoEmprendimiento {
  idEmprendimiento: Id
  estadoNuevo: EstadoEmprendimiento
  fechaCambio: FechaISO
  motivo: string | null
}

/** Registro de reingreso de un emprendimiento inactivo. */
export interface ReingresoEmprendimiento {
  idEmprendimiento: Id
  fechaReingreso: FechaISO
}

/**
 * Diagnóstico inicial y etapa de ingreso, registrados juntos porque el
 * diagnóstico se hace durante la primera asesoría y de él se desprende la
 * etapa en la que continúa el emprendimiento.
 */
export interface DiagnosticoInicialPayload {
  idEmprendimiento: Id
  situacionActual: string
  idEtapaIngreso: Id
}

/**
 * Proyección resuelta para la tabla de listado: evita traer el detalle
 * completo (integrantes, historial) solo para pintar la tabla.
 */
export interface EmprendimientoListado {
  idEmprendimiento: Id
  nombreReferencia: string
  etapaNombre: string
  faseNombre: string
  estado: EstadoEmprendimiento
  ultimaActividad: FechaISO
  diagnosticoPendiente: boolean
}

/** Criterios de consulta del listado. */
export interface FiltrosEmprendimientos {
  busqueda?: string
  estado?: EstadoEmprendimiento | "todos"
}

/**
 * Crear un emprendimiento directamente desde el panel admin, sin pasar por
 * la aprobación de un precandidato. `numeroIdentificacion` busca si el
 * fundador ya existe (cuenta activa o precandidato sin aprobar);
 * `nombre`/`correo` solo se usan si no se encuentra a nadie.
 */
export interface CrearEmprendimientoPayload {
  nombreReferencia: string
  numeroIdentificacion: string
  nombre: string
  correo: string
}

export interface EmprendimientoCreado {
  idEmprendimiento: Id
}
