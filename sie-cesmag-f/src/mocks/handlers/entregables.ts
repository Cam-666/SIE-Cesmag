import { delay, http, HttpResponse } from "msw"
import type { NuevoEntregablePayload, RevisarEntregablePayload } from "@/domain/entregable/types"
import { ENTREGABLES, type EntregableMock } from "@/mocks/data/entregables"
import { EMPRENDIMIENTOS } from "@/mocks/data/emprendimientos"
import { FASES } from "@/domain/ruta/catalogo"

function ultimoEstadoRevision(entregable: EntregableMock) {
  const ultimo = entregable.intentos[entregable.intentos.length - 1]
  return ultimo?.estadoRevision ?? null
}

function aListado(entregable: EntregableMock) {
  return {
    idEntregable: entregable.idEntregable,
    titulo: entregable.titulo,
    emprendimiento: entregable.emprendimiento,
    faseNombre: entregable.faseNombre,
    estadoActividad: entregable.estadoActividad,
    estadoRevision: ultimoEstadoRevision(entregable),
  }
}

export const entregablesHandlers = [
  http.get("/api/entregables", async ({ request }) => {
    await delay(400)
    const url = new URL(request.url)
    const estado = url.searchParams.get("estado")

    let resultado = ENTREGABLES
    if (estado && estado !== "todos") {
      resultado = resultado.filter((e) => ultimoEstadoRevision(e) === estado)
    }

    return HttpResponse.json(resultado.map(aListado))
  }),

  http.get("/api/emprendimientos/:id/fases/:idFase/entregables", async ({ params }) => {
    await delay(400)
    const idEmprendimiento = Number(params.id)
    const idFase = Number(params.idFase)
    const resultado = ENTREGABLES.filter(
      (e) => e.idEmprendimiento === idEmprendimiento && e.idFase === idFase,
    )
    return HttpResponse.json(resultado.map(aListado))
  }),

  http.get("/api/entregables/:id", async ({ params }) => {
    await delay(400)
    const entregable = ENTREGABLES.find((e) => e.idEntregable === Number(params.id))
    if (!entregable) {
      return HttpResponse.json({ message: "Entregable no encontrado" }, { status: 404 })
    }
    return HttpResponse.json({ ...entregable, idEmprendimientoFase: entregable.idEmprendimiento * 100 + entregable.idFase })
  }),

  http.post("/api/entregables", async ({ request }) => {
    await delay(400)
    const body = (await request.json()) as NuevoEntregablePayload
    const emprendimiento = EMPRENDIMIENTOS.find((e) => e.idEmprendimiento === body.idEmprendimiento)
    const fase = FASES.find((f) => f.idFase === body.idFase)

    const nuevo: EntregableMock = {
      idEntregable: Date.now(),
      idEmprendimiento: body.idEmprendimiento,
      idFase: body.idFase,
      emprendimiento: emprendimiento?.nombreReferencia ?? "—",
      faseNombre: fase ? `${fase.numero}. ${fase.nombre}` : "—",
      titulo: body.titulo,
      descripcion: body.descripcion,
      fechaPrevista: body.fechaPrevista,
      estadoActividad: "pendiente",
      intentos: [],
    }
    ENTREGABLES.unshift(nuevo)
    return HttpResponse.json(aListado(nuevo), { status: 201 })
  }),

  http.patch("/api/entregables/:id/revision", async ({ params, request }) => {
    await delay(400)
    const entregable = ENTREGABLES.find((e) => e.idEntregable === Number(params.id))
    if (!entregable) {
      return HttpResponse.json({ message: "Entregable no encontrado" }, { status: 404 })
    }
    const body = (await request.json()) as RevisarEntregablePayload
    const ultimo = entregable.intentos[entregable.intentos.length - 1]
    if (ultimo) {
      ultimo.estadoRevision = body.decision
      ultimo.observaciones = body.observaciones ?? null
    }
    return HttpResponse.json({
      ...entregable,
      idEmprendimientoFase: entregable.idEmprendimiento * 100 + entregable.idFase,
    })
  }),
]
