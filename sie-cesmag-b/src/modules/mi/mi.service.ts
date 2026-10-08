import { prisma } from "../../lib/prisma.js"
import { construirRuta } from "../../lib/ruta.js"
import { ahoraComoFechaAsesoria } from "../../lib/horario.js"
import { resolverIdEmprendimientoDeEmprendedor } from "../emprendimientos/emprendimientos.service.js"
import { listarMisEntregables } from "../entregables/entregables.service.js"

/** Resumen del panel principal del portal del emprendedor: avance de la ruta, entregables y próxima asesoría. */
export async function obtenerMiDashboard(idUsuario: string) {
  const idEmprendimiento = await resolverIdEmprendimientoDeEmprendedor(idUsuario)

  const filtroAsesoriasFuturas = {
    estadoAsesoria: "programada" as const,
    fechaAsesoria: { gte: ahoraComoFechaAsesoria() },
    emprendimientoFase: { idEmprendimiento },
  }

  const [rutaInfo, entregables, proximaAsesoriaRow, proximasAsesoriasCount] = await Promise.all([
    construirRuta(idEmprendimiento),
    listarMisEntregables(idUsuario),
    prisma.asesoria.findFirst({
      where: filtroAsesoriasFuturas,
      orderBy: { fechaAsesoria: "asc" },
      include: { agenda: { include: { usuario: true } } },
    }),
    prisma.asesoria.count({ where: filtroAsesoriasFuturas }),
  ])

  const etapaActual = rutaInfo.ruta.find((e) => e.idEtapa === rutaInfo.faseActual?.fase.idEtapa)
  const entregablesRecientes = [...entregables]
    .sort((a, b) => b.fechaPrevista.localeCompare(a.fechaPrevista))
    .slice(0, 5)
    .map((e) => ({ idEntregable: e.idEntregable, titulo: e.titulo, estado: e.estado, fecha: e.fechaPrevista }))

  return {
    progresoPct: rutaInfo.totalFases > 0 ? Math.round((rutaInfo.fasesCompletadas / rutaInfo.totalFases) * 100) : 0,
    etapaActual: etapaActual?.nombre ?? "Diagnóstico pendiente",
    faseActual: rutaInfo.faseActual?.fase.nombre ?? "—",
    faseNumero: rutaInfo.faseActual?.fase.numero ?? 0,
    totalFases: rutaInfo.totalFases,
    actividadesPendientes: entregables.filter((e) => e.estado === "pendiente" || e.estado === "no_entregado").length,
    entregablesEntregados: entregables.filter((e) => e.estadoActividad === "entregado").length,
    entregablesAprobados: entregables.filter((e) => e.estado === "aprobado").length,
    proximasAsesoriasCount,
    entregablesRecientes,
    proximaAsesoria: proximaAsesoriaRow
      ? {
          idAsesoria: proximaAsesoriaRow.idAsesoria,
          titulo: proximaAsesoriaRow.titulo,
          fechaAsesoria: proximaAsesoriaRow.fechaAsesoria.toISOString(),
          asesor: proximaAsesoriaRow.agenda.usuario.nombre,
        }
      : null,
  }
}
