import { delay, http, HttpResponse } from "msw"
import { MI_ID_EMPRENDIMIENTO, MI_PERFIL } from "@/mocks/data/mi-perfil"
import { construirDetalleEmprendimiento, EMPRENDIMIENTOS } from "@/mocks/data/emprendimientos"
import { ENTREGABLES } from "@/mocks/data/entregables"
import { ASESORIAS } from "@/mocks/data/asesorias"
import { AGENDA } from "@/mocks/data/agenda"
import { USUARIOS } from "@/mocks/data/usuarios"
import { TOTAL_FASES } from "@/mocks/data/ruta"
import type { EditarPerfilPayload } from "@/domain/emprendedor/types"
import type { EstadoRevision } from "@/domain/entregable/types"
import type { AgendarAsesoriaPayload } from "@/domain/asesoria/types"
import { resolverCadenaMock } from "@/mocks/utils/cadena-bloques"

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

  // Registra un nuevo intento de entrega con la evidencia cargada — en real
  // esto sube a Google Drive; en el mock, igual que antes de tener backend,
  // basta con un blob: URL de la sesión (EvidenciaEnlace.tsx ya sabe abrirlo).
  http.post("/api/mi/entregables/:id/evidencia", async ({ params, request }) => {
    await delay(400)
    const entregable = ENTREGABLES.find((e) => e.idEntregable === Number(params.id))
    if (!entregable) {
      return HttpResponse.json({ message: "Entregable no encontrado" }, { status: 404 })
    }
    const formulario = await request.formData()
    const archivo = formulario.get("archivo") as File
    const comentario = formulario.get("comentario") as string | null
    entregable.intentos.push({
      idIntentoEntrega: Date.now(),
      idEntregable: entregable.idEntregable,
      rutaEvidencia: URL.createObjectURL(archivo),
      nombreArchivo: archivo.name,
      fechaEntrega: new Date().toISOString(),
      estadoRevision: "pendiente",
      observaciones: comentario || null,
    })
    entregable.estadoActividad = "entregado"
    return HttpResponse.json({
      ...entregable,
      idEmprendimientoFase: entregable.idEmprendimiento * 100 + entregable.idFase,
    })
  }),

  // Retracta el último intento mientras sigue pendiente de revisión.
  http.delete("/api/mi/entregables/:id/evidencia", async ({ params }) => {
    await delay(400)
    const entregable = ENTREGABLES.find((e) => e.idEntregable === Number(params.id))
    if (!entregable) {
      return HttpResponse.json({ message: "Entregable no encontrado" }, { status: 404 })
    }
    const ultimo = entregable.intentos[entregable.intentos.length - 1] ?? null
    if (!ultimo || ultimo.estadoRevision !== "pendiente") {
      return HttpResponse.json({ message: "No hay una entrega pendiente de revisión para borrar." }, { status: 400 })
    }
    entregable.intentos.pop()
    entregable.estadoActividad = new Date(entregable.fechaPrevista) < new Date() ? "no_entregado" : "pendiente"
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
    const yaTienePendiente = ASESORIAS.some(
      (a) => a.idEmprendimiento === MI_ID_EMPRENDIMIENTO && a.estadoAsesoria === "programada",
    )
    if (yaTienePendiente) {
      return HttpResponse.json(
        { message: "Ya tiene una asesoría programada pendiente de resultado." },
        { status: 409 },
      )
    }
    const emprendimiento = EMPRENDIMIENTOS.find((e) => e.idEmprendimiento === MI_ID_EMPRENDIMIENTO)
    const cadena = resolverCadenaMock(AGENDA, body.idAgenda, body.duracionMinutos)
    if (!cadena) {
      return HttpResponse.json(
        { message: "No hay disponibilidad continua suficiente para esa duración." },
        { status: 400 },
      )
    }
    cadena.forEach((b) => (b.estado = "reservado"))
    const bloque = cadena[0]
    const asesor = USUARIOS.find((u) => u.idUsuario === Number(bloque.idUsuario))

    const nueva = {
      idAsesoria: Date.now(),
      idEmprendimiento: MI_ID_EMPRENDIMIENTO,
      fechaAsesoria: `${bloque.fecha}T${bloque.horaInicio}:00.000Z`,
      emprendimiento: emprendimiento?.nombreReferencia ?? "—",
      asesor: asesor?.nombre ?? "—",
      tipoAsesoria: body.tipoAsesoria,
      modalidad: body.modalidad,
      estadoAsesoria: "programada" as const,
      avance: null,
      observaciones: body.motivo,
      idAgenda: bloque.idAgenda,
      duracionMinutos: body.duracionMinutos,
    }
    ASESORIAS.unshift(nueva)
    return HttpResponse.json(nueva, { status: 201 })
  }),
]
