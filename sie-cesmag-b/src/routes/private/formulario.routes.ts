import { Router } from "express"
import { requiereSesion } from "../../middleware/auth.js"
import { requierePermiso } from "../../middleware/permisos.js"
import { decisionPrecandidatoSchema } from "../../modules/formulario/formulario.schemas.js"
import { decidirPrecandidato, listarPrecandidatos } from "../../modules/formulario/formulario.service.js"

export const rutasFormulario = Router()

rutasFormulario.use(requiereSesion)

/** Listado de precandidatos pendientes de aprobación. */
rutasFormulario.get("/precandidatos", requierePermiso("emprendimientos", "ver"), async (_req, res) => {
  res.json(await listarPrecandidatos())
})

/** Aprueba o rechaza un precandidato. */
rutasFormulario.post(
  "/precandidatos/:id/decision",
  requierePermiso("emprendimientos", "anadir"),
  async (req, res) => {
    const { decision } = decisionPrecandidatoSchema.parse(req.body)
    res.json(await decidirPrecandidato(Number(req.params.id), decision))
  },
)
