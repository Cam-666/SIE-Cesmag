import { prisma } from "./prisma.js"

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

  const enCurso = emprendimientoFases.find((ef) => ef.estadoFase === "en_curso")
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

  const ultimaFaseTocada = [...emprendimientoFases].sort((a, b) => b.fechaInicio.getTime() - a.fechaInicio.getTime())[0]
  const ultimaActividad = ultimaFaseTocada?.fechaInicio ?? null

  return { ruta, fasesCompletadas, totalFases, diagnosticoPendiente, faseActual, ultimaActividad }
}
