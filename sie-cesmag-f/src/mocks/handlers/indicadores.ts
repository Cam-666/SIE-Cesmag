import { delay, http, HttpResponse } from "msw"
import {
  calcularAvancePorFase,
  calcularDesercionPorEtapa,
  calcularDistribucionPorEtapa,
  calcularResumen,
  calcularRetencionDesercion,
  calcularTiempoPermanencia,
} from "@/mocks/data/indicadores"
import type {
  EntregableRecienteResumen,
  FiltroPeriodo,
  ProximaAsesoriaResumen,
} from "@/domain/indicadores/types"

function periodoDeUrl(url: URL): FiltroPeriodo | undefined {
  const desde = url.searchParams.get("desde")
  const hasta = url.searchParams.get("hasta")
  if (!desde && !hasta) return undefined
  return { desde: desde ?? "", hasta: hasta ?? "" }
}

const PROXIMAS_ASESORIAS: ProximaAsesoriaResumen[] = [
  {
    idAsesoria: 1,
    fechaAsesoria: "2026-09-16T10:00:00Z",
    asesor: "María López",
    emprendimiento: "EcoPack Solutions",
    estadoAsesoria: "programada",
  },
  {
    idAsesoria: 2,
    fechaAsesoria: "2026-09-17T16:00:00Z",
    asesor: "Carlos Ruiz",
    emprendimiento: "Diseño & Estilo",
    estadoAsesoria: "programada",
  },
  {
    idAsesoria: 3,
    fechaAsesoria: "2026-09-18T15:00:00Z",
    asesor: "Ana Gómez",
    emprendimiento: "Sweet Bakery",
    estadoAsesoria: "programada",
  },
]

const ENTREGABLES_RECIENTES: EntregableRecienteResumen[] = [
  {
    idEntregable: 1,
    titulo: "Lienzo de modelo",
    emprendimiento: "EcoPack Solutions",
    estadoActividad: "entregado",
  },
  {
    idEntregable: 2,
    titulo: "Propuesta de valor",
    emprendimiento: "EcoPack Solutions",
    estadoActividad: "pendiente",
  },
  {
    idEntregable: 3,
    titulo: "Segmento de clientes",
    emprendimiento: "PetConnect",
    estadoActividad: "entregado",
  },
]

export const indicadoresHandlers = [
  http.get("/api/indicadores/resumen", async ({ request }) => {
    await delay(400)
    return HttpResponse.json(calcularResumen(periodoDeUrl(new URL(request.url))))
  }),

  http.get("/api/indicadores/distribucion-etapa", async ({ request }) => {
    await delay(400)
    return HttpResponse.json(calcularDistribucionPorEtapa(periodoDeUrl(new URL(request.url))))
  }),

  http.get("/api/indicadores/avance-fase", async ({ request }) => {
    await delay(400)
    return HttpResponse.json(calcularAvancePorFase(periodoDeUrl(new URL(request.url))))
  }),

  http.get("/api/indicadores/desercion-etapa", async ({ request }) => {
    await delay(400)
    return HttpResponse.json(calcularDesercionPorEtapa(periodoDeUrl(new URL(request.url))))
  }),

  http.get("/api/indicadores/retencion-desercion", async ({ request }) => {
    await delay(400)
    return HttpResponse.json(calcularRetencionDesercion(periodoDeUrl(new URL(request.url))))
  }),

  http.get("/api/indicadores/tiempo-permanencia", async ({ request }) => {
    await delay(400)
    return HttpResponse.json(calcularTiempoPermanencia(periodoDeUrl(new URL(request.url))))
  }),

  http.get("/api/dashboard/proximas-asesorias", async () => {
    await delay(400)
    return HttpResponse.json(PROXIMAS_ASESORIAS)
  }),

  http.get("/api/dashboard/entregables-recientes", async () => {
    await delay(400)
    return HttpResponse.json(ENTREGABLES_RECIENTES)
  }),

  // Datos de ejemplo fijos: sin estos dos handlers la petición caía al servidor
  // de Vite (HTML) y el gráfico de tendencia reventaba al intentar mapear el resultado.
  http.get("/api/indicadores/tendencia-mensual", async () => {
    await delay(400)
    return HttpResponse.json([
      { mes: "2026-04", ingresos: 4, culminaciones: 0 },
      { mes: "2026-05", ingresos: 3, culminaciones: 1 },
      { mes: "2026-06", ingresos: 5, culminaciones: 0 },
      { mes: "2026-07", ingresos: 2, culminaciones: 1 },
      { mes: "2026-08", ingresos: 4, culminaciones: 2 },
      { mes: "2026-09", ingresos: 3, culminaciones: 1 },
    ])
  }),

  http.get("/api/indicadores/tasa-aprobacion-entregables", async () => {
    await delay(400)
    return HttpResponse.json({ aprobados: 6, rechazados: 2, tasaAprobacion: 75 })
  }),
]
