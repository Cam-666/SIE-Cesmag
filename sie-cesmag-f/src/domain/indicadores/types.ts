/**
 * Tipos de agregación para Dashboard y Reportes e Indicadores. No
 * corresponden a una entidad del ER: son cálculos derivados del resto de
 * entidades, expuestos por la API ya resueltos para las pantallas.
 */

export interface ResumenIndicadores {
  totalEmprendimientos: number
  activos: number
  inactivos: number
  completados: number
  emprendedores: number
  asesorias: number
  compromisos: number
}

export interface DistribucionPorEtapa {
  idEtapa: number
  nombreEtapa: string
  cantidad: number
}

export interface AvancePorFase {
  idFase: number
  nombreFase: string
  cantidad: number
}

/** Desistimientos agrupados por la etapa en la que iban. */
export interface DesercionPorEtapa {
  idEtapa: number
  nombreEtapa: string
  cantidadDesistimientos: number
}

/** Tiempo de permanencia en el proceso de los emprendimientos que lo culminaron. */
export interface TiempoPermanencia {
  promedioDias: number
  minimoDias: number
  maximoDias: number
}

export interface FiltroPeriodo {
  desde: string
  hasta: string
}

/** Comparación agregada de retención frente a deserción. */
export interface RetencionDesercion {
  retenidos: number
  desertados: number
}

/** Proyección ligera para el widget "Próximas asesorías" del Dashboard. */
export interface ProximaAsesoriaResumen {
  idAsesoria: number
  fechaAsesoria: string
  asesor: string
  emprendimiento: string
  estadoAsesoria: "programada" | "completada" | "cancelada"
}

/** Proyección ligera para el widget "Entregables recientes" del Dashboard. */
export interface EntregableRecienteResumen {
  idEntregable: number
  titulo: string
  emprendimiento: string
  estadoActividad: "pendiente" | "entregado" | "no_entregado"
}

/** Ingresos y culminaciones por mes (RF-17), para el gráfico de tendencia. */
export interface PuntoTendenciaMensual {
  mes: string
  ingresos: number
  culminaciones: number
}

/** % de intentos de entrega aprobados sobre el total ya revisado. */
export interface TasaAprobacionEntregables {
  aprobados: number
  rechazados: number
  tasaAprobacion: number
}
