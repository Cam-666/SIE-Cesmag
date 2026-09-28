/** Identificador numérico autoincremental (columnas SERIAL/INTEGER del ER). */
export type Id = number

/** Fecha/hora en formato ISO 8601, tal como la entrega la API (TIMESTAMP/DATE del ER). */
export type FechaISO = string

/** Envoltorio genérico de respuesta de la API. */
export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface Paginacion {
  pagina: number
  porPagina: number
  total: number
  totalPaginas: number
}

/** Respuesta paginada genérica (listados de Emprendimientos, Asesorías, Entregables, etc.). */
export interface RespuestaPaginada<T> {
  items: T[]
  paginacion: Paginacion
}
