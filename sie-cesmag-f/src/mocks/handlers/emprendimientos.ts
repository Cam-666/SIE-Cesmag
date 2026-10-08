import { delay, http, HttpResponse } from "msw"
import { construirDetalleEmprendimiento, EMPRENDIMIENTOS, fasesCompletadasDe } from "@/mocks/data/emprendimientos"
import { ASESORIAS } from "@/mocks/data/asesorias"
import { ETAPAS, FASES } from "@/domain/ruta/catalogo"
import type { CaracterizacionEmprendimiento, DiagnosticoInicialPayload } from "@/domain/emprendimiento/types"

function buscarEmprendimiento(idParam: string) {
  const id = Number(idParam)
  return EMPRENDIMIENTOS.find((e) => e.idEmprendimiento === id)
}

export const emprendimientosHandlers = [
  http.get("/api/emprendimientos", async ({ request }) => {
    await delay(400)
    const url = new URL(request.url)
    const busqueda = url.searchParams.get("busqueda")?.trim().toLowerCase()
    const estado = url.searchParams.get("estado")

    let resultado = EMPRENDIMIENTOS

    if (busqueda) {
      resultado = resultado.filter((e) => e.nombreReferencia.toLowerCase().includes(busqueda))
    }
    if (estado && estado !== "todos") {
      resultado = resultado.filter((e) => e.estado === estado)
    }

    return HttpResponse.json(
      resultado.map(
        ({
          idEmprendimiento,
          nombreReferencia,
          etapaNombre,
          faseNombre,
          estado,
          ultimaActividad,
          diagnosticoPendiente,
        }) => ({
          idEmprendimiento,
          nombreReferencia,
          etapaNombre,
          faseNombre,
          estado,
          ultimaActividad,
          diagnosticoPendiente,
        }),
      ),
    )
  }),

  http.get("/api/emprendimientos/:id", async ({ params }) => {
    await delay(400)
    const emprendimiento = buscarEmprendimiento(params.id as string)
    if (!emprendimiento) {
      return HttpResponse.json({ message: "Emprendimiento no encontrado" }, { status: 404 })
    }

    return HttpResponse.json(construirDetalleEmprendimiento(emprendimiento))
  }),

  http.post("/api/emprendimientos/:id/integrantes", async ({ params, request }) => {
    await delay(400)
    const emprendimiento = buscarEmprendimiento(params.id as string)
    if (!emprendimiento) {
      return HttpResponse.json({ message: "Emprendimiento no encontrado" }, { status: 404 })
    }
    const body = (await request.json()) as { numeroIdentificacion: string }
    emprendimiento.integrantes = [...emprendimiento.integrantes, `Nuevo integrante (${body.numeroIdentificacion})`]
    return HttpResponse.json({ idUsuario: Date.now(), idEmprendimiento: emprendimiento.idEmprendimiento })
  }),

  // El idUsuario de un integrante se deriva como idEmprendimiento*10 + índice
  // (ver `construirDetalleEmprendimiento`), así que se revierte esa fórmula para ubicarlo.
  http.patch("/api/emprendimientos/:id/integrantes/:idUsuario", async ({ params, request }) => {
    await delay(300)
    const emprendimiento = buscarEmprendimiento(params.id as string)
    if (!emprendimiento) {
      return HttpResponse.json({ message: "Emprendimiento no encontrado" }, { status: 404 })
    }
    const indice = Number(params.idUsuario) - emprendimiento.idEmprendimiento * 10
    if (indice < 0 || indice >= emprendimiento.integrantes.length) {
      return HttpResponse.json({ message: "Integrante no encontrado" }, { status: 404 })
    }
    const body = (await request.json()) as { nombre: string }
    emprendimiento.integrantes = emprendimiento.integrantes.map((nombre, i) =>
      i === indice ? body.nombre : nombre,
    )
    return HttpResponse.json({ idUsuario: Number(params.idUsuario), idEmprendimiento: emprendimiento.idEmprendimiento })
  }),

  http.delete("/api/emprendimientos/:id/integrantes/:idUsuario", async ({ params }) => {
    await delay(300)
    const emprendimiento = buscarEmprendimiento(params.id as string)
    if (!emprendimiento) {
      return HttpResponse.json({ message: "Emprendimiento no encontrado" }, { status: 404 })
    }
    const indice = Number(params.idUsuario) - emprendimiento.idEmprendimiento * 10
    emprendimiento.integrantes = emprendimiento.integrantes.filter((_, i) => i !== indice)
    return new HttpResponse(null, { status: 204 })
  }),

  http.patch("/api/emprendimientos/:id/estado", async ({ params, request }) => {
    await delay(400)
    const emprendimiento = buscarEmprendimiento(params.id as string)
    if (!emprendimiento) {
      return HttpResponse.json({ message: "Emprendimiento no encontrado" }, { status: 404 })
    }
    const body = (await request.json()) as { estadoNuevo: typeof emprendimiento.estado; motivo: string | null }
    emprendimiento.estado = body.estadoNuevo
    emprendimiento.motivo = body.motivo
    emprendimiento.ultimaActividad = new Date().toISOString()
    return HttpResponse.json(emprendimiento)
  }),

  http.post("/api/emprendimientos/:id/reingreso", async ({ params }) => {
    await delay(400)
    const emprendimiento = buscarEmprendimiento(params.id as string)
    if (!emprendimiento) {
      return HttpResponse.json({ message: "Emprendimiento no encontrado" }, { status: 404 })
    }
    emprendimiento.estado = "activo"
    emprendimiento.motivo = null
    emprendimiento.ultimaActividad = new Date().toISOString()
    return HttpResponse.json(emprendimiento)
  }),

  http.patch("/api/emprendimientos/:id/caracterizacion", async ({ params, request }) => {
    await delay(400)
    const emprendimiento = buscarEmprendimiento(params.id as string)
    if (!emprendimiento) {
      return HttpResponse.json({ message: "Emprendimiento no encontrado" }, { status: 404 })
    }
    emprendimiento.caracterizacion = (await request.json()) as CaracterizacionEmprendimiento
    return HttpResponse.json(emprendimiento)
  }),

  // Diagnóstico inicial + etapa de ingreso, registrados juntos como la
  // primera asesoría (diagnóstica) del emprendimiento.
  http.post("/api/emprendimientos/:id/diagnostico-inicial", async ({ params, request }) => {
    await delay(400)
    const emprendimiento = buscarEmprendimiento(params.id as string)
    if (!emprendimiento) {
      return HttpResponse.json({ message: "Emprendimiento no encontrado" }, { status: 404 })
    }
    const body = (await request.json()) as DiagnosticoInicialPayload
    const etapaIngreso = ETAPAS.find((e) => e.idEtapa === body.idEtapaIngreso)
    const primeraFase = FASES.filter((f) => f.idEtapa === body.idEtapaIngreso).sort(
      (a, b) => a.numero - b.numero,
    )[0]
    if (!etapaIngreso || !primeraFase) {
      return HttpResponse.json({ message: "Etapa de ingreso inválida" }, { status: 400 })
    }

    emprendimiento.diagnosticoPendiente = false
    emprendimiento.etapaNombre = etapaIngreso.nombre
    emprendimiento.faseNombre = `${primeraFase.numero}. ${primeraFase.nombre}`
    emprendimiento.ultimaActividad = new Date().toISOString()

    ASESORIAS.unshift({
      idAsesoria: Date.now(),
      idEmprendimiento: emprendimiento.idEmprendimiento,
      fechaAsesoria: new Date().toISOString(),
      emprendimiento: emprendimiento.nombreReferencia,
      asesor: "Carlos Andrés Ruiz",
      tipoAsesoria: "diagnostica",
      modalidad: "presencial",
      estadoAsesoria: "completada",
      avance: body.situacionActual,
      observaciones: null,
      idAgenda: null,
      duracionMinutos: 30,
    })

    return HttpResponse.json(emprendimiento)
  }),

  // Aprobar cumplimiento de la fase actual y avanzar a la siguiente.
  http.post("/api/emprendimientos/:id/avanzar-fase", async ({ params }) => {
    await delay(400)
    const emprendimiento = buscarEmprendimiento(params.id as string)
    if (!emprendimiento) {
      return HttpResponse.json({ message: "Emprendimiento no encontrado" }, { status: 404 })
    }

    const fasesCompletadas = fasesCompletadasDe(emprendimiento)
    const siguienteFase = FASES.find((f) => f.numero === fasesCompletadas + 2)
    if (!siguienteFase) {
      // Ya estaba en la última fase: el emprendimiento culmina la ruta.
      emprendimiento.estado = "terminado"
      emprendimiento.motivo = "Culminó exitosamente la ruta de acompañamiento"
      emprendimiento.faseNombre = "12. Lanzamiento y Escala"
      emprendimiento.etapaNombre = "Aceleración y Escala"
      emprendimiento.ultimaActividad = new Date().toISOString()
      return HttpResponse.json(emprendimiento)
    }

    const etapaSiguiente = ETAPAS.find((e) => e.idEtapa === siguienteFase.idEtapa)
    emprendimiento.faseNombre = `${siguienteFase.numero}. ${siguienteFase.nombre}`
    emprendimiento.etapaNombre = etapaSiguiente?.nombre ?? emprendimiento.etapaNombre
    emprendimiento.ultimaActividad = new Date().toISOString()
    return HttpResponse.json(emprendimiento)
  }),
]
