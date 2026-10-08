import { Router } from "express"
import { requiereSesion } from "../../middleware/auth.js"
import { requierePermiso } from "../../middleware/permisos.js"
import * as indicadoresSvc from "../../modules/indicadores/indicadores.service.js"
import { filtroPeriodoSchema } from "../../modules/indicadores/indicadores.schemas.js"

export const rutasIndicadores = Router()

rutasIndicadores.use(requiereSesion)

/**
 * Dashboard y Reportes e Indicadores comparten el mismo permiso de
 * "ver" por el que ya se filtran en el sidebar y en las rutas del frontend
 * (`RequirePermiso`) — aquí solo hace falta el más laxo de los dos, así que
 * cada endpoint exige el módulo que realmente lo usa.
 */
rutasIndicadores.get("/indicadores/resumen", requierePermiso("dashboard", "ver"), async (req, res) => {
  const periodo = filtroPeriodoSchema.parse(req.query)
  res.json(await indicadoresSvc.obtenerResumen(periodo))
})

rutasIndicadores.get("/indicadores/distribucion-etapa", requierePermiso("dashboard", "ver"), async (req, res) => {
  const periodo = filtroPeriodoSchema.parse(req.query)
  res.json(await indicadoresSvc.obtenerDistribucionPorEtapa(periodo))
})

rutasIndicadores.get("/indicadores/avance-fase", requierePermiso("reportes", "ver"), async (req, res) => {
  const periodo = filtroPeriodoSchema.parse(req.query)
  res.json(await indicadoresSvc.obtenerAvancePorFase(periodo))
})

rutasIndicadores.get("/indicadores/desercion-etapa", requierePermiso("reportes", "ver"), async (req, res) => {
  const periodo = filtroPeriodoSchema.parse(req.query)
  res.json(await indicadoresSvc.obtenerDesercionPorEtapa(periodo))
})

rutasIndicadores.get("/indicadores/retencion-desercion", requierePermiso("reportes", "ver"), async (req, res) => {
  const periodo = filtroPeriodoSchema.parse(req.query)
  res.json(await indicadoresSvc.obtenerRetencionDesercion(periodo))
})

rutasIndicadores.get("/indicadores/tiempo-permanencia", requierePermiso("reportes", "ver"), async (req, res) => {
  const periodo = filtroPeriodoSchema.parse(req.query)
  res.json(await indicadoresSvc.obtenerTiempoPermanencia(periodo))
})

rutasIndicadores.get("/indicadores/tendencia-mensual", requierePermiso("dashboard", "ver"), async (req, res) => {
  const periodo = filtroPeriodoSchema.parse(req.query)
  res.json(await indicadoresSvc.obtenerTendenciaMensual(periodo))
})

rutasIndicadores.get("/indicadores/tasa-aprobacion-entregables", requierePermiso("reportes", "ver"), async (req, res) => {
  const periodo = filtroPeriodoSchema.parse(req.query)
  res.json(await indicadoresSvc.obtenerTasaAprobacionEntregables(periodo))
})

rutasIndicadores.get("/dashboard/proximas-asesorias", requierePermiso("dashboard", "ver"), async (_req, res) => {
  res.json(await indicadoresSvc.obtenerProximasAsesorias())
})

rutasIndicadores.get("/dashboard/entregables-recientes", requierePermiso("dashboard", "ver"), async (_req, res) => {
  res.json(await indicadoresSvc.obtenerEntregablesRecientes())
})
