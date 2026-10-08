import { Router } from "express"
import { requiereSesion } from "../../middleware/auth.js"
import { requierePermiso } from "../../middleware/permisos.js"
import * as asesoriasSvc from "../../modules/asesorias/asesorias.service.js"
import {
  cancelarReprogramarSchema,
  filtrosAsesoriasSchema,
  nuevaAsesoriaSchema,
  registrarResultadoSchema,
} from "../../modules/asesorias/asesorias.schemas.js"

export const rutasAsesorias = Router()

rutasAsesorias.use(requiereSesion)

/** Histórico de asesorías de un emprendimiento — parte del detalle, mismo permiso que verlo. */
rutasAsesorias.get(
  "/emprendimientos/:id/asesorias",
  requierePermiso("emprendimientos", "ver"),
  async (req, res) => {
    res.json(await asesoriasSvc.listarHistorialPorEmprendimiento(Number(req.params.id)))
  },
)

/** Listado general de asesorías. */
rutasAsesorias.get("/asesorias", requierePermiso("asesorias", "ver"), async (req, res) => {
  const filtros = filtrosAsesoriasSchema.parse(req.query)
  res.json(await asesoriasSvc.listarAsesorias(filtros))
})

/**
 * Asesorías propias del usuario administrativo autenticado, como asesor —
 * para "Mi calendario" (Mi perfil). Sin `requierePermiso`: es su propia
 * agenda, no el listado general del módulo.
 */
rutasAsesorias.get("/asesorias/mias", async (req, res) => {
  res.json(await asesoriasSvc.listarMisAsesoriasComoAsesor(req.usuario!.idUsuario))
})

/** Crea una asesoría agendada por el coordinador/empleado. */
rutasAsesorias.post("/asesorias", requierePermiso("asesorias", "anadir"), async (req, res) => {
  const payload = nuevaAsesoriaSchema.parse(req.body)
  res.status(201).json(await asesoriasSvc.crearAsesoria(req.usuario!.idUsuario, payload))
})

/**
 * Cancelar o reprogramar. Ruta compartida entre el portal admin y el del
 * emprendedor, por eso el chequeo de autorización no puede resolverse con un
 * `requierePermiso` fijo: en el portal admin depende de la acción (cancelar
 * pide "eliminar", reprogramar pide "editar"); en el portal del emprendedor
 * (que no tiene matriz de permisos) siempre está permitido, pero solo sobre
 * sus propias asesorías.
 */
rutasAsesorias.patch("/asesorias/:id", async (req, res) => {
  const payload = cancelarReprogramarSchema.parse(req.body)
  const idAsesoria = Number(req.params.id)
  const usuario = req.usuario!

  if (usuario.ambito === "admin") {
    const accionRequerida = payload.accion === "cancelar" ? "eliminar" : "editar"
    const permiso = usuario.permisos.find((p) => p.modulo === "asesorias")
    if (!permiso?.acciones.includes(accionRequerida)) {
      res.status(403).json({ message: "No tiene permiso para realizar esta acción." })
      return
    }
  } else {
    await asesoriasSvc.verificarPropiedadEmprendedor(idAsesoria, usuario.idUsuario)
  }

  res.json(await asesoriasSvc.cancelarOReprogramar(idAsesoria, payload))
})

/** Registrar lo ocurrido en una asesoría ya programada — exclusivo del asesor (portal admin), nunca del emprendedor. */
rutasAsesorias.patch(
  "/asesorias/:id/resultado",
  requierePermiso("asesorias", "editar"),
  async (req, res) => {
    const payload = registrarResultadoSchema.parse(req.body)
    res.json(await asesoriasSvc.registrarResultado(Number(req.params.id), payload))
  },
)

/** Eliminar del registro una asesoría ya cancelada. */
rutasAsesorias.delete("/asesorias/:id", requierePermiso("asesorias", "eliminar"), async (req, res) => {
  await asesoriasSvc.eliminarAsesoria(Number(req.params.id))
  res.status(204).end()
})
