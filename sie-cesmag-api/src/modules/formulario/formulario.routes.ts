import { Router } from "express"
import { requiereSesion } from "../../middleware/auth.js"
import { requierePermiso } from "../../middleware/permisos.js"
import { decisionPrecandidatoSchema, recibirFormularioSchema } from "./formulario.schemas.js"
import { decidirPrecandidato, listarPrecandidatos, recibirFormulario } from "./formulario.service.js"

/**
 * La llama la integración con Google Forms (Apps Script), no una persona con
 * sesión en la plataforma — protegida por una clave compartida en un
 * encabezado, no por `requiereSesion`. Va en su propio router, montado antes
 * que cualquier otro con `requiereSesion` a nivel de router (ver app.ts):
 * dos routers de Express montados en el mismo prefijo comparten el mismo
 * tramo del camino, así que el middleware de bloque del primero que calce el
 * prefijo se ejecuta para todas las rutas que pasen por ahí.
 */
export const rutasFormularioPublico = Router()

rutasFormularioPublico.post("/formulario/respuestas", async (req, res) => {
  const clave = req.headers["x-formulario-clave"]
  if (!clave || clave !== process.env.FORMULARIO_CLAVE_SECRETA) {
    res.status(401).json({ message: "No autorizado." })
    return
  }
  const payload = recibirFormularioSchema.parse(req.body)
  res.json(await recibirFormulario(payload))
})

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
