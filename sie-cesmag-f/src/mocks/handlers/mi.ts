import { delay, http, HttpResponse } from "msw"
import { MI_ID_EMPRENDIMIENTO, MI_PERFIL } from "@/mocks/data/mi-perfil"
import { construirDetalleEmprendimiento, EMPRENDIMIENTOS } from "@/mocks/data/emprendimientos"
import { ENTREGABLES } from "@/mocks/data/entregables"
import { ASESORIAS } from "@/mocks/data/asesorias"
import { AGENDA } from "@/mocks/data/agenda"
import { USUARIOS } from "@/mocks/data/usuarios"
import { TOTAL_FASES } from "@/mocks/data/ruta"
import type { EditarPerfilPayload } from "@/domain/emprendedor/types"
import type { CargarEvidenciaPayload, EstadoRevision } from "@/domain/entregable/types"
import type { AgendarAsesoriaPayload } from "@/domain/asesoria/types"

function estadoEmprendedor(estadoActividad: string, estadoRevision: EstadoRevision | null) {
  if (estadoRevision === "aprobado") return "aprobado" as const
  if (estadoRevision === "pendiente") return "en_revision" as const
  if (estadoRevision === "rechazado") return "pendiente" as const // requiere reintentar la entrega
  return estadoActividad === "no_entregado" ? ("no_entregado" as const) : ("pendiente" as const)
}

export const miHandlers = [
  http.get("/api/mi/perfil", async () => {
    await delay(400)
    return HttpResponse.json(MI_PERFIL)
  }),

  http.patch("/api/mi/perfil", async ({ request }) => {
    await delay(400)
    const body = (await request.json()) as EditarPerfilPayload
    if (body.telefono !== undefined) MI_PERFIL.telefono = body.telefono
    if (body.programaAcademico !== undefined) MI_PERFIL.programaAcademico = body.programaAcademico
    MI_PERFIL.fechaActualizacion = new Date().toISOString()
    return HttpResponse.json(MI_PERFIL)
  }),

  http.get("/api/mi/emprendimiento", async () => {
    await delay(400)
    const emprendimiento = EMPRENDIMIENTOS.find((e) => e.idEmprendimiento === MI_ID_EMPRENDIMIENTO)
    if (!emprendimiento) {
      return HttpResponse.json({ message: "Emprendimiento no encontrado" }, { status: 404 })
    }
    return HttpResponse.json(construirDetalleEmprendimiento(emprendimiento))
  }),

  http.get("/api/mi/dashboard", async () => {
    await delay(400)
    const emprendimiento = EMPRENDIMIENTOS.find((e) => e.idEmprendimiento === MI_ID_EMPRENDIMIENTO)!
    const detalle = construirDetalleEmprendimiento(emprendimiento)
    const misEntregables = ENTREGABLES.filter((e) => e.idEmprendimiento === MI_ID_EMPRENDIMIENTO)

    const entregablesRecientes = misEntregables.map((e) => {
      const ultimo = e.intentos[e.intentos.length - 1] ?? null
      return {
        idEntregable: e.idEntregable,
        titulo: e.titulo,
        estado: estadoEmprendedor(e.estadoActividad, ultimo?.estadoRevision ?? null),
        fecha: ultimo?.fechaEntrega ?? e.fechaPrevista,
      }
    })

    const proximaAsesoriaData = ASESORIAS.filter(
      (a) => a.idEmprendimiento === MI_ID_EMPRENDIMIENTO && a.estadoAsesoria === "programada",
    ).sort((a, b) => new Date(a.fechaAsesoria).getTime() - new Date(b.fechaAsesoria).getTime())[0]

    return HttpResponse.json({
      progresoPct: Math.round((detalle.fasesCompletadas / detalle.totalFases) * 100),
      etapaActual: emprendimiento.etapaNombre,
      faseActual: detalle.faseActual!.fase!.nombre,
      faseNumero: detalle.faseActual!.fase!.numero,
      totalFases: TOTAL_FASES,
      actividadesPendientes: misEntregables.filter(
        (e) => estadoEmprendedor(e.estadoActividad, e.intentos[e.intentos.length - 1]?.estadoRevision ?? null) === "pendiente",
      ).length,
      entregablesEntregados: misEntregables.filter((e) => e.estadoActividad === "entregado").length,
      entregablesAprobados: misEntregables.filter(
        (e) => e.intentos[e.intentos.length - 1]?.estadoRevision === "aprobado",
      ).length,
      proximasAsesoriasCount: ASESORIAS.filter(
        (a) => a.idEmprendimiento === MI_ID_EMPRENDIMIENTO && a.estadoAsesoria === "programada",
      ).length,
      entregablesRecientes,
      proximaAsesoria: proximaAsesoriaData
        ? {
            idAsesoria: proximaAsesoriaData.idAsesoria,
            titulo: `Asesoría de seguimiento · ${detalle.faseActual!.fase!.nombre}`,
            fechaAsesoria: proximaAsesoriaData.fechaAsesoria,
            asesor: proximaAsesoriaData.asesor,
          }
        : null,
    })
  }),

  // Entregables asignados al emprendimiento del emprendedor autenticado.
  http.get("/api/mi/entregables", async () => {
    await delay(400)
    const resultado = ENTREGABLES.filter((e) => e.idEmprendimiento === MI_ID_EMPRENDIMIENTO).map(
      (e) => {
        const ultimo = e.intentos[e.intentos.length - 1] ?? null
        return {
          idEntregable: e.idEntregable,
          titulo: e.titulo,
          descripcion: e.descripcion,
          faseNombre: e.faseNombre,
          fechaPrevista: e.fechaPrevista,
          estadoActividad: e.estadoActividad,
          estado: estadoEmprendedor(e.estadoActividad, ultimo?.estadoRevision ?? null),
        }
      },
    )
    return HttpResponse.json(resultado)
  }),

  // Registra un nuevo intento de entrega con la evidencia cargada.
  http.post("/api/mi/entregables/:id/evidencia", async ({ params, request }) => {
    await delay(400)
    const entregable = ENTREGABLES.find((e) => e.idEntregable === Number(params.id))
    if (!entregable) {
      return HttpResponse.json({ message: "Entregable no encontrado" }, { status: 404 })
    }
    const body = (await request.json()) as CargarEvidenciaPayload
    entregable.intentos.push({
      idIntentoEntrega: Date.now(),
      idEntregable: entregable.idEntregable,
      rutaEvidencia: body.rutaEvidencia,
      nombreArchivo: body.nombreArchivo,
      fechaEntrega: new Date().toISOString(),
      estadoRevision: "pendiente",
      observaciones: body.comentario ?? null,
    })
    entregable.estadoActividad = "entregado"
    return HttpResponse.json({
      ...entregable,
      idEmprendimientoFase: entregable.idEmprendimiento * 100 + entregable.idFase,
    })
  }),

  // Asesorías del emprendimiento del emprendedor autenticado.
  http.get("/api/mi/asesorias", async () => {
    await delay(400)
    const resultado = ASESORIAS.filter((a) => a.idEmprendimiento === MI_ID_EMPRENDIMIENTO)
    return HttpResponse.json(
      [...resultado].sort(
        (a, b) => new Date(b.fechaAsesoria).getTime() - new Date(a.fechaAsesoria).getTime(),
      ),
    )
  }),

  // Agendar dentro de un bloque disponible de la agenda del asesor elegido (coordinador,
  // vicerrector o empleado — quien tenga el bloque, no uno fijo).
  http.post("/api/mi/asesorias", async ({ request }) => {
    await delay(400)
    const body = (await request.json()) as AgendarAsesoriaPayload
    const emprendimiento = EMPRENDIMIENTOS.find((e) => e.idEmprendimiento === MI_ID_EMPRENDIMIENTO)
    const bloque = AGENDA.find((a) => a.idAgenda === body.idAgenda)
    if (!bloque || bloque.estado !== "disponible") {
      return HttpResponse.json(
        { message: "El horario seleccionado ya no está disponible" },
        { status: 400 },
      )
    }
    bloque.estado = "reservado"
    const asesor = USUARIOS.find((u) => u.idUsuario === Number(bloque.idUsuario))

    const nueva = {
      idAsesoria: Date.now(),
      idEmprendimiento: MI_ID_EMPRENDIMIENTO,
      fechaAsesoria: `${bloque.fecha}T${bloque.horaInicio}:00`,
      emprendimiento: emprendimiento?.nombreReferencia ?? "—",
      asesor: asesor?.nombre ?? "—",
      tipoAsesoria: body.tipoAsesoria,
      modalidad: "virtual" as const,
      estadoAsesoria: "programada" as const,
      avance: null,
      observaciones: body.motivo,
      idAgenda: bloque.idAgenda,
    }
    ASESORIAS.unshift(nueva)
    return HttpResponse.json(nueva, { status: 201 })
  }),
]
