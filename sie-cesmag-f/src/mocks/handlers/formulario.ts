import { delay, http, HttpResponse } from "msw"
import { PRECANDIDATOS } from "@/mocks/data/formulario"
import { EMPRENDIMIENTOS } from "@/mocks/data/emprendimientos"
import { USUARIOS } from "@/mocks/data/usuarios"
import type { DecisionPrecandidatoPayload } from "@/domain/formulario/types"

export const formularioHandlers = [
  http.get("/api/precandidatos", async () => {
    await delay(400)
    return HttpResponse.json(PRECANDIDATOS)
  }),

  // Al aprobar se crea la cuenta de emprendedor (rol 4) y su emprendimiento,
  // sin etapa asignada hasta el diagnóstico inicial.
  http.post("/api/precandidatos/:id/decision", async ({ params, request }) => {
    await delay(400)
    const idFormulario = Number(params.id)
    const index = PRECANDIDATOS.findIndex((p) => p.idFormulario === idFormulario)
    if (index === -1) {
      return HttpResponse.json({ message: "Precandidato no encontrado" }, { status: 404 })
    }
    const precandidato = PRECANDIDATOS[index]
    const body = (await request.json()) as DecisionPrecandidatoPayload

    PRECANDIDATOS.splice(index, 1)

    if (body.decision === "aprobado") {
      const idUsuario = Date.now()
      USUARIOS.push({
        idUsuario,
        nombre: precandidato.nombre,
        correo: precandidato.correo,
        idRol: 4,
        activo: true,
        fechaCreacion: new Date().toISOString(),
      })

      EMPRENDIMIENTOS.push({
        idEmprendimiento: idUsuario,
        nombreReferencia: precandidato.nombreEmprendimientoPropuesto ?? precandidato.nombre,
        etapaNombre: "Sin etapa asignada",
        faseNombre: "Pendiente de diagnóstico inicial",
        estado: "activo",
        ultimaActividad: new Date().toISOString(),
        diagnosticoPendiente: true,
        fechaIngreso: new Date().toISOString(),
        motivo: null,
        integrantes: [precandidato.nombre],
        // La caracterización respondida en el formulario pasa tal cual a
        // "Información adicional" del nuevo emprendimiento.
        caracterizacion: precandidato.caracterizacion,
      })
    }

    return new HttpResponse(null, { status: 204 })
  }),
]
