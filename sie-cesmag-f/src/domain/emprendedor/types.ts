import type { FechaISO, Id } from "@/types/common"
import type { EstadoEntregableEmprendedor } from "@/domain/entregable/types"

/** Entidad EMPRENDEDOR (ER). `semestre`/`jornada` son del bloque 2 del formulario ("Perfil del estudiante"), por persona. */
export interface Emprendedor {
  /** UUID de Supabase Auth, no un `Id` autoincremental. */
  idUsuario: string
  nombre: string
  correo: string
  numeroIdentificacion: string
  fechaNacimiento: FechaISO | null
  fechaRegistro: FechaISO
  fechaActualizacion: FechaISO | null
  // Datos de contacto/perfil editables por el propio emprendedor en "Mi perfil".
  telefono?: string | null
  programaAcademico?: string | null
  semestre?: number | null
  jornada?: string | null
}

/** Relación EMPRENDEDOR_EMPRENDIMIENTO: integrantes de un mismo emprendimiento. */
export interface IntegranteEmprendimiento {
  idUsuario: string
  idEmprendimiento: Id
  emprendedor?: Emprendedor
}

/** Datos de contacto editables desde "Mi perfil". */
export interface EditarPerfilPayload {
  telefono?: string | null
  programaAcademico?: string | null
}

/** Proyección para "Mis entregables recientes" y "Entregables recientes" del dashboard del emprendedor. */
export interface EntregableResumenEmprendedor {
  idEntregable: Id
  titulo: string
  estado: EstadoEntregableEmprendedor
  fecha: FechaISO
}

/** Proyección para la tarjeta "Próxima asesoría" del dashboard del emprendedor. */
export interface ProximaAsesoriaEmprendedor {
  idAsesoria: Id
  titulo: string
  fechaAsesoria: FechaISO
  asesor: string
}

/** Datos resueltos para el dashboard del portal del emprendedor. */
export interface DashboardEmprendedor {
  progresoPct: number
  etapaActual: string
  faseActual: string
  faseNumero: number
  totalFases: number
  actividadesPendientes: number
  entregablesEntregados: number
  entregablesAprobados: number
  proximasAsesoriasCount: number
  entregablesRecientes: EntregableResumenEmprendedor[]
  proximaAsesoria: ProximaAsesoriaEmprendedor | null
}
