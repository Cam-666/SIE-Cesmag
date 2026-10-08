import type { Prisma } from "@prisma/client"
import { prisma } from "../../lib/prisma.js"
import { ahoraComoFechaAsesoria } from "../../lib/horario.js"
import type { FiltroPeriodo } from "./indicadores.schemas.js"

const incluirFases = {
  fases: { include: { fase: true } },
} satisfies Prisma.EmprendimientoInclude

type EmprendimientoConFases = Prisma.EmprendimientoGetPayload<{ include: typeof incluirFases }>

/**
 * Fase donde va actualmente un emprendimiento: "en_curso", o "pausada" si
 * quedó congelada ahí al pasar a inactivo (ver `cambiarEstado` en
 * emprendimientos.service.ts). Si ya completó las 12, es la última; si
 * todavía no tiene diagnóstico inicial (sin filas), no hay fase que contar.
 */
function resolverFaseActual(fases: EmprendimientoConFases["fases"]) {
  const activa = fases.find((f) => f.estadoFase === "en_curso" || f.estadoFase === "pausada")
  if (activa) return activa
  if (fases.length > 0 && fases.every((f) => f.estadoFase === "completada")) {
    return [...fases].sort((a, b) => b.fase.numero - a.fase.numero)[0]
  }
  return null
}

/** `undefined` si no hay filtro de periodo — deja la consulta sin acotar por fecha. */
function rangoFecha(periodo: FiltroPeriodo | undefined): Prisma.DateTimeFilter | undefined {
  if (!periodo?.desde && !periodo?.hasta) return undefined
  return {
    ...(periodo.desde ? { gte: periodo.desde } : {}),
    ...(periodo.hasta ? { lte: periodo.hasta } : {}),
  }
}

/** Conteos generales — cada entidad se acota por su propia fecha de referencia cuando hay periodo. */
export async function obtenerResumen(periodo?: FiltroPeriodo) {
  const rango = rangoFecha(periodo)
  const [totalEmprendimientos, activos, inactivos, completados, emprendedores, asesorias, compromisos] =
    await Promise.all([
      prisma.emprendimiento.count({ where: rango ? { fechaIngreso: rango } : undefined }),
      prisma.emprendimiento.count({ where: { estado: "activo", ...(rango ? { fechaIngreso: rango } : {}) } }),
      prisma.emprendimiento.count({ where: { estado: "inactivo", ...(rango ? { fechaIngreso: rango } : {}) } }),
      prisma.emprendimiento.count({ where: { estado: "terminado", ...(rango ? { fechaIngreso: rango } : {}) } }),
      rango
        ? prisma.emprendedor.count({ where: { emprendimientos: { some: { emprendimiento: { fechaIngreso: rango } } } } })
        : prisma.emprendedor.count(),
      prisma.asesoria.count({ where: rango ? { fechaAsesoria: rango } : undefined }),
      prisma.entregable.count({ where: rango ? { fechaPrevista: rango } : undefined }),
    ])
  return { totalEmprendimientos, activos, inactivos, completados, emprendedores, asesorias, compromisos }
}

/** Cuántos emprendimientos hay actualmente en cada una de las 3 etapas (incluye las de conteo 0). */
export async function obtenerDistribucionPorEtapa(periodo?: FiltroPeriodo) {
  const rango = rangoFecha(periodo)
  const [etapas, emprendimientos] = await Promise.all([
    prisma.etapa.findMany({ orderBy: { numero: "asc" } }),
    prisma.emprendimiento.findMany({
      where: rango ? { fechaIngreso: rango } : undefined,
      include: incluirFases,
    }),
  ])
  const conteos = new Map(etapas.map((e) => [e.idEtapa, 0]))
  for (const emp of emprendimientos) {
    const faseActual = resolverFaseActual(emp.fases)
    if (!faseActual) continue
    conteos.set(faseActual.fase.idEtapa, (conteos.get(faseActual.fase.idEtapa) ?? 0) + 1)
  }
  return etapas.map((e) => ({ idEtapa: e.idEtapa, nombreEtapa: e.nombre, cantidad: conteos.get(e.idEtapa) ?? 0 }))
}

/** Lo mismo que la distribución por etapa, pero con el detalle de las 12 fases. */
export async function obtenerAvancePorFase(periodo?: FiltroPeriodo) {
  const rango = rangoFecha(periodo)
  const [fases, emprendimientos] = await Promise.all([
    prisma.fase.findMany({ orderBy: { numero: "asc" } }),
    prisma.emprendimiento.findMany({
      where: rango ? { fechaIngreso: rango } : undefined,
      include: incluirFases,
    }),
  ])
  const conteos = new Map(fases.map((f) => [f.idFase, 0]))
  for (const emp of emprendimientos) {
    const faseActual = resolverFaseActual(emp.fases)
    if (!faseActual) continue
    conteos.set(faseActual.idFase, (conteos.get(faseActual.idFase) ?? 0) + 1)
  }
  return fases.map((f) => ({
    idFase: f.idFase,
    nombreFase: `${f.numero}. ${f.nombre}`,
    cantidad: conteos.get(f.idFase) ?? 0,
  }))
}

/**
 * Desistimientos agrupados por la etapa en la que iban — la etapa de la fase
 * que quedó "pausada" al desistir (o la de ingreso, si por alguna razón no
 * hay ninguna pausada, p. ej. un desistimiento sin diagnóstico registrado).
 */
export async function obtenerDesercionPorEtapa(periodo?: FiltroPeriodo) {
  const rango = rangoFecha(periodo)
  const etapas = await prisma.etapa.findMany({ orderBy: { numero: "asc" } })
  const emprendimientos = await prisma.emprendimiento.findMany({
    where: { estado: "inactivo", ...(rango ? { fechaDesistimiento: rango } : {}) },
    include: incluirFases,
  })
  const conteos = new Map(etapas.map((e) => [e.idEtapa, 0]))
  for (const emp of emprendimientos) {
    const faseActual = resolverFaseActual(emp.fases)
    const idEtapa = faseActual?.fase.idEtapa ?? emp.idEtapaIngreso
    if (idEtapa == null) continue
    conteos.set(idEtapa, (conteos.get(idEtapa) ?? 0) + 1)
  }
  return etapas.map((e) => ({
    idEtapa: e.idEtapa,
    nombreEtapa: e.nombre,
    cantidadDesistimientos: conteos.get(e.idEtapa) ?? 0,
  }))
}

/** Comparación agregada, simple, de retención (activo/terminado) frente a deserción (inactivo). */
export async function obtenerRetencionDesercion(periodo?: FiltroPeriodo) {
  const rango = rangoFecha(periodo)
  const [retenidos, desertados] = await Promise.all([
    prisma.emprendimiento.count({
      where: { estado: { in: ["activo", "terminado"] }, ...(rango ? { fechaIngreso: rango } : {}) },
    }),
    prisma.emprendimiento.count({ where: { estado: "inactivo", ...(rango ? { fechaIngreso: rango } : {}) } }),
  ])
  return { retenidos, desertados }
}

/** Días entre el ingreso y la culminación, solo sobre emprendimientos "terminado". */
export async function obtenerTiempoPermanencia(periodo?: FiltroPeriodo) {
  const rango = rangoFecha(periodo)
  const terminados = await prisma.emprendimiento.findMany({
    where: { estado: "terminado", fechaCulminacion: { not: null, ...(rango ?? {}) } },
    select: { fechaIngreso: true, fechaCulminacion: true },
  })
  if (terminados.length === 0) return { promedioDias: 0, minimoDias: 0, maximoDias: 0 }

  const dias = terminados.map((e) =>
    Math.round((e.fechaCulminacion!.getTime() - e.fechaIngreso.getTime()) / 86_400_000),
  )
  return {
    promedioDias: Math.round(dias.reduce((a, b) => a + b, 0) / dias.length),
    minimoDias: Math.min(...dias),
    maximoDias: Math.max(...dias),
  }
}

const NOMBRES_MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]

function claveDeFecha(fecha: Date): string {
  return `${fecha.getUTCFullYear()}-${String(fecha.getUTCMonth() + 1).padStart(2, "0")}`
}

/** Lista de claves "YYYY-MM" entre dos fechas, inclusive — tope de 24 para que el gráfico no se vuelva ilegible con "todo el periodo". */
function clavesDeMeses(desde: Date, hasta: Date): string[] {
  const claves: string[] = []
  const cursor = new Date(Date.UTC(desde.getUTCFullYear(), desde.getUTCMonth(), 1))
  const fin = new Date(Date.UTC(hasta.getUTCFullYear(), hasta.getUTCMonth(), 1))
  while (cursor <= fin && claves.length < 24) {
    claves.push(claveDeFecha(cursor))
    cursor.setUTCMonth(cursor.getUTCMonth() + 1)
  }
  return claves
}

/**
 * Ingresos y culminaciones por mes (RF-17: "cantidad de ingresos y
 * culminaciones por periodo" — era el único dato de ese requisito que
 * todavía no se calculaba). Sin periodo, muestra los últimos 12 meses.
 */
export async function obtenerTendenciaMensual(periodo?: FiltroPeriodo) {
  const hasta = periodo?.hasta ?? new Date()
  const desde = periodo?.desde ?? new Date(Date.UTC(hasta.getUTCFullYear(), hasta.getUTCMonth() - 11, 1))
  const claves = clavesDeMeses(desde, hasta)
  const limiteSuperior = new Date(Date.UTC(hasta.getUTCFullYear(), hasta.getUTCMonth() + 1, 1))
  const limiteInferior = new Date(Date.UTC(desde.getUTCFullYear(), desde.getUTCMonth(), 1))

  const [ingresos, culminaciones] = await Promise.all([
    prisma.emprendimiento.findMany({
      where: { fechaIngreso: { gte: limiteInferior, lt: limiteSuperior } },
      select: { fechaIngreso: true },
    }),
    prisma.emprendimiento.findMany({
      where: { estado: "terminado", fechaCulminacion: { gte: limiteInferior, lt: limiteSuperior } },
      select: { fechaCulminacion: true },
    }),
  ])

  const conteoIngresos = new Map(claves.map((c) => [c, 0]))
  const conteoCulminaciones = new Map(claves.map((c) => [c, 0]))
  for (const e of ingresos) {
    const clave = claveDeFecha(e.fechaIngreso)
    if (conteoIngresos.has(clave)) conteoIngresos.set(clave, (conteoIngresos.get(clave) ?? 0) + 1)
  }
  for (const e of culminaciones) {
    const clave = claveDeFecha(e.fechaCulminacion!)
    if (conteoCulminaciones.has(clave)) conteoCulminaciones.set(clave, (conteoCulminaciones.get(clave) ?? 0) + 1)
  }

  return claves.map((clave) => {
    const [anio, mes] = clave.split("-")
    return {
      mes: `${NOMBRES_MES[Number(mes) - 1]} ${anio}`,
      ingresos: conteoIngresos.get(clave) ?? 0,
      culminaciones: conteoCulminaciones.get(clave) ?? 0,
    }
  })
}

/** % de intentos de entrega aprobados sobre el total ya revisado (aprobado + rechazado) — mide la calidad/avance real del acompañamiento. */
export async function obtenerTasaAprobacionEntregables(periodo?: FiltroPeriodo) {
  const rango = rangoFecha(periodo)
  const [aprobados, rechazados] = await Promise.all([
    prisma.intentoEntrega.count({ where: { estadoRevision: "aprobado", ...(rango ? { fechaEntrega: rango } : {}) } }),
    prisma.intentoEntrega.count({ where: { estadoRevision: "rechazado", ...(rango ? { fechaEntrega: rango } : {}) } }),
  ])
  const total = aprobados + rechazados
  return { aprobados, rechazados, tasaAprobacion: total > 0 ? Math.round((aprobados / total) * 100) : 0 }
}

/** Próximas 5 asesorías programadas, para el widget del Dashboard. */
export async function obtenerProximasAsesorias() {
  const asesorias = await prisma.asesoria.findMany({
    where: { estadoAsesoria: "programada", fechaAsesoria: { gte: ahoraComoFechaAsesoria() } },
    include: {
      agenda: { include: { usuario: true } },
      emprendimientoFase: { include: { emprendimiento: true } },
    },
    orderBy: { fechaAsesoria: "asc" },
    take: 5,
  })
  return asesorias.map((a) => ({
    idAsesoria: a.idAsesoria,
    fechaAsesoria: a.fechaAsesoria.toISOString(),
    asesor: a.agenda.usuario.nombre,
    emprendimiento: a.emprendimientoFase.emprendimiento.nombreReferencia,
    estadoAsesoria: "programada" as const,
  }))
}

/** Últimos 5 entregables con evidencia cargada, para el widget del Dashboard. */
export async function obtenerEntregablesRecientes() {
  const entregables = await prisma.entregable.findMany({
    include: {
      emprendimientoFase: { include: { emprendimiento: true } },
      intentos: { orderBy: { idIntentoEntrega: "desc" }, take: 1 },
    },
  })
  const recientes = entregables
    .filter((e) => e.intentos[0]?.fechaEntrega)
    .sort((a, b) => b.intentos[0].fechaEntrega!.getTime() - a.intentos[0].fechaEntrega!.getTime())
    .slice(0, 5)

  return recientes.map((e) => ({
    idEntregable: e.idEntregable,
    titulo: e.titulo,
    emprendimiento: e.emprendimientoFase.emprendimiento.nombreReferencia,
    estadoActividad: e.estadoActividad,
  }))
}
