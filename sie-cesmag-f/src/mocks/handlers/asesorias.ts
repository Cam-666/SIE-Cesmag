import { delay, http, HttpResponse } from "msw"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type {
  AsesoriaHistorialItem,
  NuevaAsesoriaPayload,
  RegistrarResultadoAsesoriaPayload,
} from "@/domain/asesoria/types"
import { EMPRENDIMIENTOS } from "@/mocks/data/emprendimientos"
import { ASESORIAS } from "@/mocks/data/asesorias"
import { AGENDA } from "@/mocks/data/agenda"
import { USUARIOS } from "@/mocks/data/usuarios"
import { MI_ID_EMPRENDIMIENTO } from "@/mocks/data/mi-perfil"
import { NOTIFICACIONES_EMPRENDEDOR } from "@/mocks/data/notificaciones"
import { idUsuarioActual, usuarioActual } from "@/mocks/utils/usuario-actual"
import { resolverCadenaMock, resolverCadenaReservadaMock } from "@/mocks/utils/cadena-bloques"

const HISTORIAL_ECOPACK: AsesoriaHistorialItem[] = [
  {
    idAsesoria: 1,
    fechaAsesoria: "2026-09-15T10:00:00Z",
    asesor: "María López",
    faseNombre: "4. Ideación Estratégica",
    titulo: "Validación de propuesta de valor",
    estadoAsesoria: "completada",
    avance:
      "El emprendimiento cuenta con validación inicial y requiere fortalecer su modelo de negocio.",
    actividades: [
      { descripcion: "Realizar 5 entrevistas a clientes.", responsable: "Juan Pérez", cumplido: false },
      {
        descripcion: "Actualizar lienzo de propuesta de valor.",
        responsable: "María López",
        cumplido: true,
      },
    ],
  },
  {
    idAsesoria: 2,
    fechaAsesoria: "2026-09-08T11:00:00Z",
    asesor: "Juan Pérez",
    faseNombre: "2. Empatía",
    titulo: "Validación de problema",
    estadoAsesoria: "completada",
    avance: "Se validó el problema central con el segmento de clientes objetivo.",
    actividades: [
      { descripcion: "Documentar hallazgos de validación.", responsable: "Juan Pérez", cumplido: true },
    ],
  },
]

function historialGenerico(idEmprendimiento: number): AsesoriaHistorialItem[] {
  const emprendimiento = EMPRENDIMIENTOS.find((e) => e.idEmprendimiento === idEmprendimiento)
  if (!emprendimiento) return []

  return [
    {
      idAsesoria: idEmprendimiento * 100 + 1,
      fechaAsesoria: emprendimiento.ultimaActividad,
      asesor: "Carlos Andrés Ruiz",
      faseNombre: emprendimiento.faseNombre,
      titulo: "Seguimiento de proceso",
      estadoAsesoria: "completada",
      avance: "Seguimiento general del avance del emprendimiento en su fase actual.",
      actividades: [
        {
          descripcion: "Revisar avances de la fase actual.",
          responsable: emprendimiento.integrantes[0] ?? "Equipo emprendedor",
          cumplido: true,
        },
      ],
    },
  ]
}

export const asesoriasHandlers = [
  http.get("/api/emprendimientos/:id/asesorias", async ({ params }) => {
    await delay(400)
    const id = Number(params.id)
    const historial = id === 124 ? HISTORIAL_ECOPACK : historialGenerico(id)
    return HttpResponse.json(historial)
  }),

  http.get("/api/asesorias", async ({ request }) => {
    await delay(400)
    const url = new URL(request.url)
    const estado = url.searchParams.get("estado")

    let resultado = ASESORIAS
    if (estado && estado !== "todos") {
      resultado = resultado.filter((a) => a.estadoAsesoria === estado)
    }

    return HttpResponse.json(
      [...resultado].sort(
        (a, b) => new Date(b.fechaAsesoria).getTime() - new Date(a.fechaAsesoria).getTime(),
      ),
    )
  }),

  /** Asesorías propias del usuario administrativo autenticado, como asesor — para "Mi calendario". */
  http.get("/api/asesorias/mias", async ({ request }) => {
    await delay(400)
    const idUsuario = idUsuarioActual(request)
    const resultado = ASESORIAS.filter((a) => {
      const bloque = AGENDA.find((b) => b.idAgenda === a.idAgenda)
      return bloque?.idUsuario === String(idUsuario)
    })
    return HttpResponse.json(
      [...resultado].sort((a, b) => new Date(b.fechaAsesoria).getTime() - new Date(a.fechaAsesoria).getTime()),
    )
  }),

  http.post("/api/asesorias", async ({ request }) => {
    await delay(400)
    const body = (await request.json()) as NuevaAsesoriaPayload
    const emprendimiento = EMPRENDIMIENTOS.find((e) => e.idEmprendimiento === body.idEmprendimiento)
    const cadena = resolverCadenaMock(AGENDA, body.idAgenda, body.duracionMinutos)
    if (!cadena) {
      return HttpResponse.json(
        { message: "No hay disponibilidad continua suficiente para esa duración." },
        { status: 400 },
      )
    }
    cadena.forEach((b) => (b.estado = "reservado"))
    const bloque = cadena[0]
    const asesor = usuarioActual(request)

    const nueva = {
      idAsesoria: Date.now(),
      idEmprendimiento: body.idEmprendimiento,
      fechaAsesoria: `${bloque.fecha}T${bloque.horaInicio}:00.000Z`,
      emprendimiento: emprendimiento?.nombreReferencia ?? "—",
      asesor: asesor.nombre,
      tipoAsesoria: body.tipoAsesoria,
      modalidad: body.modalidad,
      estadoAsesoria: "programada" as const,
      avance: null,
      observaciones: null,
      idAgenda: bloque.idAgenda,
      duracionMinutos: body.duracionMinutos,
    }
    ASESORIAS.unshift(nueva)

    // El emprendedor debe enterarse cuando el coordinador/empleado agenda
    // una asesoría por decisión propia (no a iniciativa suya).
    if (body.idEmprendimiento === MI_ID_EMPRENDIMIENTO) {
      NOTIFICACIONES_EMPRENDEDOR.unshift({
        idNotificacion: Date.now(),
        idAsesoria: nueva.idAsesoria,
        idEntregable: null,
        tipo: "agendamiento_asesoria",
        mensaje: `El coordinador agendó una asesoría para el ${format(new Date(nueva.fechaAsesoria), "d 'de' MMMM", { locale: es })} a las ${format(new Date(nueva.fechaAsesoria), "h:mm a")}.`,
        leido: false,
        fechaCreacion: new Date().toISOString(),
      })
    }

    return HttpResponse.json(nueva, { status: 201 })
  }),

  http.patch("/api/asesorias/:id", async ({ params, request }) => {
    await delay(400)
    const asesoria = ASESORIAS.find((a) => a.idAsesoria === Number(params.id))
    if (!asesoria) {
      return HttpResponse.json({ message: "Asesoría no encontrada" }, { status: 404 })
    }
    const body = (await request.json()) as {
      accion: "cancelar" | "reprogramar"
      nuevoIdAgenda?: number
    }
    if (body.accion === "cancelar") {
      asesoria.estadoAsesoria = "cancelada"
      // Libera toda la cadena de bloques reservados, no solo el ancla.
      if (asesoria.idAgenda) {
        resolverCadenaReservadaMock(AGENDA, asesoria.idAgenda, asesoria.duracionMinutos).forEach(
          (b) => (b.estado = "disponible"),
        )
      }
    } else if (body.nuevoIdAgenda) {
      const nuevaCadena = resolverCadenaMock(AGENDA, body.nuevoIdAgenda, asesoria.duracionMinutos)
      if (!nuevaCadena) {
        return HttpResponse.json(
          { message: "El horario seleccionado ya no está disponible" },
          { status: 400 },
        )
      }
      // Libera la cadena anterior y reserva la nueva.
      if (asesoria.idAgenda) {
        resolverCadenaReservadaMock(AGENDA, asesoria.idAgenda, asesoria.duracionMinutos).forEach(
          (b) => (b.estado = "disponible"),
        )
      }
      nuevaCadena.forEach((b) => (b.estado = "reservado"))
      const bloqueNuevo = nuevaCadena[0]
      asesoria.fechaAsesoria = `${bloqueNuevo.fecha}T${bloqueNuevo.horaInicio}:00.000Z`
      asesoria.asesor = USUARIOS.find((u) => u.idUsuario === Number(bloqueNuevo.idUsuario))?.nombre ?? asesoria.asesor
      asesoria.idAgenda = bloqueNuevo.idAgenda
      asesoria.estadoAsesoria = "programada"
    }
    return HttpResponse.json(asesoria)
  }),

  // Registrar lo ocurrido en una asesoría ya programada, una vez pasada su fecha.
  http.patch("/api/asesorias/:id/resultado", async ({ params, request }) => {
    await delay(400)
    const asesoria = ASESORIAS.find((a) => a.idAsesoria === Number(params.id))
    if (!asesoria) {
      return HttpResponse.json({ message: "Asesoría no encontrada" }, { status: 404 })
    }
    const body = (await request.json()) as RegistrarResultadoAsesoriaPayload
    if (body.realizada) {
      asesoria.estadoAsesoria = "completada"
      asesoria.avance = body.avance ?? null
    } else {
      asesoria.estadoAsesoria = "no_realizada"
      asesoria.observaciones = body.observaciones ?? null
    }
    return HttpResponse.json(asesoria)
  }),

  http.delete("/api/asesorias/:id", async ({ params }) => {
    await delay(300)
    const indice = ASESORIAS.findIndex((a) => a.idAsesoria === Number(params.id))
    if (indice === -1) {
      return HttpResponse.json({ message: "Asesoría no encontrada" }, { status: 404 })
    }
    if (ASESORIAS[indice].estadoAsesoria !== "cancelada") {
      return HttpResponse.json(
        { message: "Solo se pueden eliminar asesorías canceladas" },
        { status: 400 },
      )
    }
    ASESORIAS.splice(indice, 1)
    return new HttpResponse(null, { status: 204 })
  }),
]
