import { timingSafeEqual } from "node:crypto"
import { Router } from "express"
import { recibirFormularioSchema } from "../../modules/formulario/formulario.schemas.js"
import { recibirFormulario } from "../../modules/formulario/formulario.service.js"

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

/** Comparación en tiempo constante: no revela cuántos caracteres de la clave coinciden. */
function claveValida(recibida: unknown): boolean {
  const esperada = process.env.FORMULARIO_CLAVE_SECRETA
  if (typeof recibida !== "string" || !esperada) return false
  const a = Buffer.from(recibida)
  const b = Buffer.from(esperada)
  return a.length === b.length && timingSafeEqual(a, b)
}

rutasFormularioPublico.post("/formulario/respuestas", async (req, res) => {
  if (!claveValida(req.headers["x-formulario-clave"])) {
    res.status(401).json({ message: "No autorizado." })
    return
  }
  const payload = recibirFormularioSchema.parse(req.body)
  res.json(await recibirFormulario(payload))
})
