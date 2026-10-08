import { z } from "zod"

export const filtrosEmprendimientosSchema = z.object({
  busqueda: z.string().optional(),
  estado: z.enum(["activo", "inactivo", "terminado", "todos"]).optional(),
})

/** Cambio de estado general de un emprendimiento. */
export const cambioEstadoSchema = z.object({
  estadoNuevo: z.enum(["activo", "inactivo", "terminado"]),
  fechaCambio: z.string().min(1),
  motivo: z.string().nullable().optional(),
})

/** Reingreso de un emprendimiento inactivo. */
export const reingresoSchema = z.object({
  fechaReingreso: z.string().min(1),
})

/** Diagnóstico inicial de un emprendimiento. */
export const diagnosticoInicialSchema = z.object({
  situacionActual: z.string().min(1, "Describa la situación actual."),
  idEtapaIngreso: z.number().int().positive(),
})

/** Los 20 campos de CaracterizacionEmprendimiento, todos opcionales/nulos. */
export const caracterizacionSchema = z.object({
  sector: z.string().nullable(),
  origenIdea: z.string().nullable(),
  tipoClientes: z.string().nullable(),
  queOfrece: z.string().nullable(),
  tiempoOperando: z.string().nullable(),
  nivelFormalizacion: z.string().nullable(),
  descripcion: z.string().nullable(),
  nivelValidacion: z.string().nullable(),
  tieneVentas: z.string().nullable(),
  alcanceVentas: z.string().nullable(),
  situacionFinanciera: z.string().nullable(),
  registroFinanciero: z.string().nullable(),
  conoceCostos: z.string().nullable(),
  numeroPersonas: z.number().nullable(),
  canalVentas: z.string().nullable(),
  herramientasDigitales: z.string().nullable(),
  tipoInnovacion: z.string().nullable(),
  fuenteFinanciacion: z.string().nullable(),
  necesidadesEstrategicas: z.string().nullable(),
  temasAcompanamiento: z.string().nullable(),
})

/**
 * `numeroIdentificacion` siempre es obligatorio; `nombre` y `correo` solo
 * son obligatorios cuando no se encuentra a nadie con ese número (el backend
 * decide cuál de los 3 casos aplica — ver `integrantes.service.ts`).
 */
export const agregarIntegranteSchema = z.object({
  numeroIdentificacion: z.string().min(1),
  nombre: z.string().min(1).optional(),
  correo: z.string().email().optional(),
  fechaNacimiento: z.string().optional(),
  programaAcademico: z.string().optional(),
  semestre: z.number().int().min(1).max(10).optional(),
  jornada: z.enum(["Diurna", "Nocturna", "Otro"]).optional(),
})

export const editarIntegranteSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio."),
})

/**
 * Crear un emprendimiento directamente desde el panel admin, sin pasar por
 * la aprobación de un precandidato. Busca por número de identificación,
 * igual que `agregarIntegranteSchema`.
 */
export const crearEmprendimientoSchema = z.object({
  nombreReferencia: z.string().min(1, "El nombre del emprendimiento es obligatorio."),
  numeroIdentificacion: z.string().min(1, "El número de identificación es obligatorio."),
  nombre: z.string().min(1).optional(),
  correo: z.string().email().optional(),
  fechaNacimiento: z.string().optional(),
  programaAcademico: z.string().optional(),
  semestre: z.number().int().min(1).max(10).optional(),
  jornada: z.enum(["Diurna", "Nocturna", "Otro"]).optional(),
})
