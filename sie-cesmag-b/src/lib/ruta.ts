import { prisma } from "./prisma.js"

/**
 * La fecha más reciente de algo que de verdad pasó en el emprendimiento:
 * un cambio de fase, una entrega cargada, o una asesoría ya resuelta. No
 * hay columnas de auditoría genéricas en el ER, así que se arma cruzando
 * estas tres fuentes en vez de fiarse solo de `EMPRENDIMIENTO_FASE.fecha_inicio`
 * (que queda igual en las 12 filas al registrar el diagnóstico, no solo en
 * la que de verdad está en curso).
 */
export async function calcularUltimaActividad(idEmprendimiento: number): Promise<Date | null> {
  const [ultimaFase, ultimaEntrega, ultimaAsesoria] = await Promise.all([
    prisma.emprendimientoFase.findFirst({
      where: { idEmprendimiento },
      orderBy: { fechaInicio: "desc" },
      select: { fechaInicio: true },
    }),
    prisma.intentoEntrega.findFirst({
      where: { entregable: { emprendimientoFase: { idEmprendimiento } }, fechaEntrega: { not: null } },
      orderBy: { fechaEntrega: "desc" },
      select: { fechaEntrega: true },
    }),
    prisma.asesoria.findFirst({
      where: { emprendimientoFase: { idEmprendimiento }, estadoAsesoria: { in: ["completada", "no_realizada"] } },
      orderBy: { fechaAsesoria: "desc" },
      select: { fechaAsesoria: true },
    }),
  ])

  const fechas = [ultimaFase?.fechaInicio, ultimaEntrega?.fechaEntrega, ultimaAsesoria?.fechaAsesoria].filter(
    (f): f is Date => f != null,
  )
  if (fechas.length === 0) return null
  return new Date(Math.max(...fechas.map((f) => f.getTime())))
}

/**
 * Arma la ruta completa (3 etapas, 12 fases) de un emprendimiento,
 * resolviendo el estado real de cada fase desde EMPRENDIMIENTO_FASE. Si
 * todavía no hay ninguna fila (nadie ha registrado el diagnóstico inicial),
 * todas las fases aparecen "pendiente" y `diagnosticoPendiente` queda en `true`.
 */
export async function construirRuta(idEmprendimiento: number) {
  const etapas = await prisma.etapa.findMany({
    orderBy: { numero: "asc" },
    include: { fases: { orderBy: { numero: "asc" } } },
  })
  const emprendimientoFases = await prisma.emprendimientoFase.findMany({ where: { idEmprendimiento } })
  const porFase = new Map(emprendimientoFases.map((ef) => [ef.idFase, ef]))

  const ruta = etapas.map((etapa) => {
    const fases = etapa.fases.map((fase) => {
      const ef = porFase.get(fase.idFase)
      return {
        idFase: fase.idFase,
        numero: fase.numero,
        nombre: fase.nombre,
        estadoFase: ef?.estadoFase ?? "pendiente",
        entregableRequerido: fase.entregablesRequeridos,
      }
    })
    const estado = fases.every((f) => f.estadoFase === "completada")
      ? "completada"
      : fases.some((f) => f.estadoFase !== "pendiente")
        ? "en_curso"
        : "pendiente"
    return { idEtapa: etapa.idEtapa, numero: etapa.numero, nombre: etapa.nombre, estado, fases }
  })

  const totalFases = etapas.reduce((acc, e) => acc + e.fases.length, 0)
  const fasesCompletadas = emprendimientoFases.filter((ef) => ef.estadoFase === "completada").length
  const diagnosticoPendiente = emprendimientoFases.length === 0

  // "pausada" es una fase "en_curso" que quedó congelada al desistir —
  // sigue siendo la fase actual para efectos de mostrar dónde va la ruta.
  const enCurso = emprendimientoFases.find((ef) => ef.estadoFase === "en_curso" || ef.estadoFase === "pausada")
  let faseActual: {
    idEmprendimientoFase: number
    idEmprendimiento: number
    idFase: number
    fechaInicio: string
    fechaFin: string | null
    estadoFase: string
    fase: { idFase: number; idEtapa: number; numero: number; nombre: string; entregablesRequeridos: string | null }
  } | undefined

  if (enCurso) {
    for (const etapa of etapas) {
      const fase = etapa.fases.find((f) => f.idFase === enCurso.idFase)
      if (fase) {
        faseActual = {
          idEmprendimientoFase: enCurso.idEmprendimientoFase,
          idEmprendimiento: enCurso.idEmprendimiento,
          idFase: enCurso.idFase,
          fechaInicio: enCurso.fechaInicio.toISOString().slice(0, 10),
          fechaFin: enCurso.fechaFin ? enCurso.fechaFin.toISOString().slice(0, 10) : null,
          estadoFase: enCurso.estadoFase,
          fase: {
            idFase: fase.idFase,
            idEtapa: fase.idEtapa,
            numero: fase.numero,
            nombre: fase.nombre,
            entregablesRequeridos: fase.entregablesRequeridos,
          },
        }
        break
      }
    }
  }

  const ultimaActividad = await calcularUltimaActividad(idEmprendimiento)

  return { ruta, fasesCompletadas, totalFases, diagnosticoPendiente, faseActual, ultimaActividad }
}
