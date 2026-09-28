import type { FechaISO, Id } from "@/types/common"

/** Estado del compromiso frente a la fecha prevista. */
export type EstadoActividad = "pendiente" | "entregado" | "no_entregado"

/** Entidad ENTREGABLE (ER). */
export interface Entregable {
  idEntregable: Id
  idEmprendimientoFase: Id
  titulo: string
  descripcion: string
  fechaPrevista: string
  estadoActividad: EstadoActividad
  ultimoIntento?: IntentoEntrega
}

/** Resultado de revisión de un intento de entrega. */
export type EstadoRevision = "pendiente" | "aprobado" | "rechazado"

/** Entidad INTENTO_ENTREGA (ER): historial de intentos de un mismo entregable. */
export interface IntentoEntrega {
  idIntentoEntrega: Id
  idEntregable: Id
  rutaEvidencia: string
  // Nombre original del archivo subido (no vive en el ER como columna propia,
  // pero un almacenamiento en la nube real siempre lo conserva junto a la
  // ruta; se usa para mostrar el archivo y habilitar su descarga).
  nombreArchivo: string
  fechaEntrega: FechaISO | null
  estadoRevision: EstadoRevision | null
  observaciones: string | null
}

/** Proyección resuelta para el listado general de entregables (wireframe "Entregables > Listado"). */
export interface EntregableListado {
  idEntregable: Id
  titulo: string
  emprendimiento: string
  faseNombre: string
  estadoActividad: EstadoActividad
  /** `null` cuando el emprendedor aún no ha cargado ninguna evidencia (distinto de "pendiente de revisión"). */
  estadoRevision: EstadoRevision | null
}

/** Detalle completo de un entregable, con su historial de intentos. */
export interface EntregableDetalle extends Entregable {
  emprendimiento: string
  faseNombre: string
  intentos: IntentoEntrega[]
}

export interface FiltrosEntregables {
  estado?: EstadoRevision | "todos"
}

/** Registro de un entregable asignado a un emprendimiento y fase. */
export interface NuevoEntregablePayload {
  idEmprendimiento: Id
  idFase: Id
  titulo: string
  descripcion: string
  fechaPrevista: string
}

/** Decisión de revisión sobre un entregable. */
export interface RevisarEntregablePayload {
  idEntregable: Id
  decision: "aprobado" | "rechazado"
  observaciones?: string
}

/**
 * Estado combinado (compromiso + revisión) desde la perspectiva del
 * emprendedor: "rechazado" se refleja como "pendiente" porque implica que
 * debe volver a intentar la entrega. La evaluación es binaria
 * (aprobado/rechazado), sin nota o calificación numérica.
 */
export type EstadoEntregableEmprendedor = "aprobado" | "en_revision" | "pendiente" | "no_entregado"

/** Proyección resuelta para "Mis entregables" del portal del emprendedor. */
export interface MiEntregableListado {
  idEntregable: Id
  titulo: string
  descripcion: string
  faseNombre: string
  fechaPrevista: string
  estadoActividad: EstadoActividad
  estado: EstadoEntregableEmprendedor
}

/**
 * Cargar el archivo de evidencia de un entregable abierto. `rutaEvidencia`
 * y `nombreArchivo` los produce la subida a la nube (ver
 * `lib/almacenamiento-nube.ts`) antes de llamar a esta mutación: el
 * emprendedor selecciona un archivo, nunca escribe un enlace a mano.
 */
export interface CargarEvidenciaPayload {
  idEntregable: Id
  rutaEvidencia: string
  nombreArchivo: string
  comentario?: string
}
