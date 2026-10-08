import { Router } from "express"
import { requiereSesion } from "../../middleware/auth.js"
import { requierePermiso } from "../../middleware/permisos.js"
import * as agendaSvc from "../../modules/agenda/agenda.service.js"
import { editarBloqueAgendaSchema, nuevoBloqueAgendaSchema } from "../../modules/agenda/agenda.schemas.js"

export const rutasAgenda = Router()

rutasAgenda.use(requiereSesion)

/** Bloques de disponibilidad propios del usuario autenticado. */
rutasAgenda.get("/agenda/mia", requierePermiso("asesorias", "ver"), async (req, res) => {
  res.json(await agendaSvc.listarMiAgenda(req.usuario!.idUsuario))
})

rutasAgenda.post("/agenda/mia", requierePermiso("asesorias", "anadir"), async (req, res) => {
  const payload = nuevoBloqueAgendaSchema.parse(req.body)
  res.status(201).json(await agendaSvc.crearBloqueAgenda(req.usuario!.idUsuario, payload))
})

/** El frontend solo usa este PATCH para alternar disponible/bloqueado (ver `DisponibilidadForm.tsx`). */
rutasAgenda.patch("/agenda/mia/:id", requierePermiso("asesorias", "editar"), async (req, res) => {
  const { estado } = editarBloqueAgendaSchema.parse(req.body)
  res.json(await agendaSvc.editarBloqueAgenda(req.usuario!.idUsuario, Number(req.params.id), estado))
})

rutasAgenda.delete("/agenda/mia/:id", requierePermiso("asesorias", "eliminar"), async (req, res) => {
  await agendaSvc.eliminarBloqueAgenda(req.usuario!.idUsuario, Number(req.params.id))
  res.status(204).end()
})

/**
 * Agenda combinada de todo el personal, para que el emprendedor agende.
 * Deliberadamente sin `requierePermiso`: el ámbito "emprendedor" no tiene
 * fila en PERMISO_ROL, así que exigir un permiso de módulo aquí bloquearía
 * el flujo de "Agendar asesoría". Basta con exigir sesión — no se expone
 * información sensible (ver `agenda.service.ts`).
 */
rutasAgenda.get("/agenda/asesor", async (_req, res) => {
  res.json(await agendaSvc.listarAgendaAsesores())
})
