import { delay, http, HttpResponse } from "msw"
import { AGENDA } from "@/mocks/data/agenda"
import { ASESORIAS } from "@/mocks/data/asesorias"
import { USUARIOS } from "@/mocks/data/usuarios"
import { idUsuarioActual } from "@/mocks/utils/usuario-actual"
import type { Agenda, EstadoAgenda, NuevoBloqueAgendaPayload } from "@/domain/agenda/types"

function ordenar(bloques: Agenda[]) {
  return [...bloques].sort((a, b) => `${a.fecha}${a.horaInicio}`.localeCompare(`${b.fecha}${b.horaInicio}`))
}

/** Nombre del emprendimiento agendado en un bloque reservado (se resuelve por la asesoría que lo referencia). */
function emprendimientoDelBloque(idAgenda: number): string | null {
  return ASESORIAS.find((a) => a.idAgenda === idAgenda)?.emprendimiento ?? null
}

export const agendaHandlers = [
  // Bloques propios del asesor autenticado (coordinador/vicerrector/empleado).
  http.get("/api/agenda/mia", async ({ request }) => {
    await delay(400)
    const idUsuario = idUsuarioActual(request)
    const resultado = AGENDA.filter((a) => a.idUsuario === String(idUsuario)).map((bloque) => ({
      ...bloque,
      emprendimiento: bloque.estado === "reservado" ? emprendimientoDelBloque(bloque.idAgenda) : null,
    }))
    return HttpResponse.json(ordenar(resultado))
  }),

  http.post("/api/agenda/mia", async ({ request }) => {
    await delay(300)
    const idUsuario = idUsuarioActual(request)
    const body = (await request.json()) as NuevoBloqueAgendaPayload
    const nuevo = {
      idAgenda: Date.now(),
      idUsuario: String(idUsuario),
      fecha: body.fecha,
      horaInicio: body.horaInicio,
      horaFin: body.horaFin,
      estado: "disponible" as const,
    }
    AGENDA.push(nuevo)
    return HttpResponse.json(nuevo, { status: 201 })
  }),

  http.patch("/api/agenda/mia/:id", async ({ params, request }) => {
    await delay(300)
    const bloque = AGENDA.find((a) => a.idAgenda === Number(params.id))
    if (!bloque) {
      return HttpResponse.json({ message: "Bloque no encontrado" }, { status: 404 })
    }
    if (bloque.estado === "reservado") {
      return HttpResponse.json(
        { message: "No se puede modificar un bloque ya agendado" },
        { status: 400 },
      )
    }
    const body = (await request.json()) as { estado: Extract<EstadoAgenda, "disponible" | "bloqueado"> }
    bloque.estado = body.estado
    return HttpResponse.json(bloque)
  }),

  http.delete("/api/agenda/mia/:id", async ({ params }) => {
    await delay(300)
    const indice = AGENDA.findIndex((a) => a.idAgenda === Number(params.id))
    if (indice === -1) {
      return HttpResponse.json({ message: "Bloque no encontrado" }, { status: 404 })
    }
    if (AGENDA[indice].estado === "reservado") {
      return HttpResponse.json(
        { message: "No se puede eliminar un bloque ya agendado" },
        { status: 400 },
      )
    }
    AGENDA.splice(indice, 1)
    return new HttpResponse(null, { status: 204 })
  }),

  // Agenda combinada de todo el personal (coordinador, vicerrector, empleados) para que el
  // emprendedor agende o reprograme con quien tenga disponibilidad, no solo con uno fijo.
  http.get("/api/agenda/asesor", async () => {
    await delay(400)
    const idsPersonal = new Set(USUARIOS.filter((u) => u.idRol !== 4).map((u) => u.idUsuario))
    const resultado = AGENDA.filter((a) => idsPersonal.has(Number(a.idUsuario))).map((bloque) => ({
      ...bloque,
      asesorNombre: USUARIOS.find((u) => u.idUsuario === Number(bloque.idUsuario))?.nombre ?? "—",
    }))
    return HttpResponse.json(ordenar(resultado))
  }),
]
