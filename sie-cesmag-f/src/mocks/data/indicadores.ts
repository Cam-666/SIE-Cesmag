import { EMPRENDIMIENTOS } from "@/mocks/data/emprendimientos"
import { ETAPAS, FASES } from "@/domain/ruta/catalogo"
import type {
  AvancePorFase,
  DesercionPorEtapa,
  DistribucionPorEtapa,
  FiltroPeriodo,
  ResumenIndicadores,
  RetencionDesercion,
  TiempoPermanencia,
} from "@/domain/indicadores/types"
import { ASESORIAS } from "@/mocks/data/asesorias"
import { ENTREGABLES } from "@/mocks/data/entregables"

/**
 * Todos los indicadores se calculan a partir de `EMPRENDIMIENTOS` (fuente
 * única, la misma que consume el resto de módulos) para que reflejen
 * cualquier cambio real, como un avance de fase o un cambio de estado.
 * `periodo` filtra por `ultimaActividad`.
 */
function enPeriodo(fechaISO: string, periodo?: FiltroPeriodo) {
  if (!periodo?.desde && !periodo?.hasta) return true
  const fecha = new Date(fechaISO).getTime()
  if (periodo.desde && fecha < new Date(periodo.desde).getTime()) return false
  if (periodo.hasta && fecha > new Date(periodo.hasta).getTime()) return false
  return true
}

function emprendimientosEnPeriodo(periodo?: FiltroPeriodo) {
  return EMPRENDIMIENTOS.filter((e) => enPeriodo(e.ultimaActividad, periodo))
}

export function calcularResumen(periodo?: FiltroPeriodo): ResumenIndicadores {
  const emprendimientos = emprendimientosEnPeriodo(periodo)
  return {
    totalEmprendimientos: emprendimientos.length,
    activos: emprendimientos.filter((e) => e.estado === "activo").length,
    inactivos: emprendimientos.filter((e) => e.estado === "inactivo").length,
    completados: emprendimientos.filter((e) => e.estado === "terminado").length,
    emprendedores: emprendimientos.reduce((total, e) => total + e.integrantes.length, 0),
    asesorias: ASESORIAS.length,
    compromisos: ENTREGABLES.length,
  }
}

function faseNumeroDe(emprendimiento: { faseNombre: string }) {
  const numero = Number.parseInt(emprendimiento.faseNombre, 10)
  return Number.isNaN(numero) ? 1 : numero
}

export function calcularDistribucionPorEtapa(periodo?: FiltroPeriodo): DistribucionPorEtapa[] {
  const emprendimientos = emprendimientosEnPeriodo(periodo)
  return ETAPAS.map((etapa) => {
    const fasesDeEtapa = new Set(FASES.filter((f) => f.idEtapa === etapa.idEtapa).map((f) => f.numero))
    return {
      idEtapa: etapa.idEtapa,
      nombreEtapa: etapa.nombre,
      cantidad: emprendimientos.filter((e) => fasesDeEtapa.has(faseNumeroDe(e))).length,
    }
  })
}

export function calcularAvancePorFase(periodo?: FiltroPeriodo): AvancePorFase[] {
  const emprendimientos = emprendimientosEnPeriodo(periodo)
  return FASES.map((fase) => ({
    idFase: fase.idFase,
    nombreFase: `${fase.numero}. ${fase.nombre}`,
    cantidad: emprendimientos.filter((e) => faseNumeroDe(e) === fase.numero).length,
  }))
}

/** Deserción = emprendimientos inactivos por desistimiento, agrupados por la etapa en la que iban. */
export function calcularDesercionPorEtapa(periodo?: FiltroPeriodo): DesercionPorEtapa[] {
  const desertados = emprendimientosEnPeriodo(periodo).filter(
    (e) => e.estado === "inactivo" && e.motivo?.toLowerCase().includes("desistimiento"),
  )
  return ETAPAS.map((etapa) => {
    const fasesDeEtapa = new Set(FASES.filter((f) => f.idEtapa === etapa.idEtapa).map((f) => f.numero))
    return {
      idEtapa: etapa.idEtapa,
      nombreEtapa: etapa.nombre,
      cantidadDesistimientos: desertados.filter((e) => fasesDeEtapa.has(faseNumeroDe(e))).length,
    }
  })
}

export function calcularRetencionDesercion(periodo?: FiltroPeriodo): RetencionDesercion {
  const emprendimientos = emprendimientosEnPeriodo(periodo)
  const desertados = emprendimientos.filter(
    (e) => e.estado === "inactivo" && e.motivo?.toLowerCase().includes("desistimiento"),
  ).length
  return { retenidos: emprendimientos.length - desertados, desertados }
}

/** Solo considera emprendimientos que culminaron la ruta (estado "terminado"). */
export function calcularTiempoPermanencia(periodo?: FiltroPeriodo): TiempoPermanencia {
  const dias = emprendimientosEnPeriodo(periodo)
    .filter((e) => e.estado === "terminado")
    .map((e) => {
      const inicio = new Date(e.fechaIngreso).getTime()
      const fin = new Date(e.ultimaActividad).getTime()
      return Math.round((fin - inicio) / (1000 * 60 * 60 * 24))
    })

  if (dias.length === 0) return { promedioDias: 0, minimoDias: 0, maximoDias: 0 }

  return {
    promedioDias: Math.round(dias.reduce((a, b) => a + b, 0) / dias.length),
    minimoDias: Math.min(...dias),
    maximoDias: Math.max(...dias),
  }
}
