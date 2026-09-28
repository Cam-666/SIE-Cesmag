import { Router } from "express"
import { requiereSesion } from "../../middleware/auth.js"
import * as notificacionesSvc from "./notificaciones.service.js"

export const rutasNotificaciones = Router()

rutasNotificaciones.use(requiereSesion)

/**
 * Centro de notificaciones, compartido entre el portal admin y el del
 * emprendedor. Sin `requierePermiso`: cada quien solo ve y marca lo suyo,
 * filtrado por `idUsuario`, no por módulo.
 */
rutasNotificaciones.get("/notificaciones", async (req, res) => {
  res.json(await notificacionesSvc.listarNotificaciones(req.usuario!.idUsuario))
})

rutasNotificaciones.patch("/notificaciones/:id/leida", async (req, res) => {
  await notificacionesSvc.marcarLeida(Number(req.params.id), req.usuario!.idUsuario)
  res.status(204).end()
})

rutasNotificaciones.post("/notificaciones/marcar-todas-leidas", async (req, res) => {
  await notificacionesSvc.marcarTodasLeidas(req.usuario!.idUsuario)
  res.status(204).end()
})
