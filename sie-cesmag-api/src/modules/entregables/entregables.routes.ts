import { Router } from "express"
import { requiereSesion } from "../../middleware/auth.js"
import { requierePermiso } from "../../middleware/permisos.js"
import * as entregablesSvc from "./entregables.service.js"
import { filtrosEntregablesSchema, nuevoEntregableSchema, revisarEntregableSchema } from "./entregables.schemas.js"

export const rutasEntregables = Router()

rutasEntregables.use(requiereSesion)

/** Drill-down de una fase de la ruta (`FaseEntregablesDialog`) — mismo permiso que ver el detalle del emprendimiento. */
rutasEntregables.get(
  "/emprendimientos/:id/fases/:idFase/entregables",
  requierePermiso("emprendimientos", "ver"),
  async (req, res) => {
    res.json(await entregablesSvc.listarEntregablesPorFase(Number(req.params.id), Number(req.params.idFase)))
  },
)

/** Listado general de entregables. */
rutasEntregables.get("/entregables", requierePermiso("entregables", "ver"), async (req, res) => {
  const filtros = filtrosEntregablesSchema.parse(req.query)
  res.json(await entregablesSvc.listarEntregables(filtros))
})

/** Crea un entregable nuevo. */
rutasEntregables.post("/entregables", requierePermiso("entregables", "anadir"), async (req, res) => {
  const payload = nuevoEntregableSchema.parse(req.body)
  res.status(201).json(await entregablesSvc.crearEntregable(payload))
})

/**
 * Detalle de un entregable: ruta compartida entre el portal admin y el
 * portal del emprendedor. El admin exige el permiso fijo del módulo; el
 * emprendedor (sin matriz de permisos) exige en cambio que sea un entregable
 * de su propio emprendimiento.
 */
rutasEntregables.get("/entregables/:id", async (req, res) => {
  const idEntregable = Number(req.params.id)
  const usuario = req.usuario!

  if (usuario.ambito === "admin") {
    const permiso = usuario.permisos.find((p) => p.modulo === "entregables")
    if (!permiso?.acciones.includes("ver")) {
      res.status(403).json({ message: "No tiene permiso para realizar esta acción." })
      return
    }
  } else {
    await entregablesSvc.verificarPropiedadEmprendedor(idEntregable, usuario.idUsuario)
  }

  res.json(await entregablesSvc.obtenerEntregable(idEntregable))
})

/** Revisión (aprobar/rechazar) del último intento — exclusivo del portal admin. */
rutasEntregables.patch("/entregables/:id/revision", requierePermiso("entregables", "editar"), async (req, res) => {
  const payload = revisarEntregableSchema.parse(req.body)
  res.json(await entregablesSvc.revisarEntregable(Number(req.params.id), payload))
})

/** URL firmada temporal para ver el archivo de evidencia — mismo criterio de autorización que el detalle. */
rutasEntregables.get("/entregables/:id/evidencia-url", async (req, res) => {
  const idEntregable = Number(req.params.id)
  const usuario = req.usuario!

  if (usuario.ambito === "admin") {
    const permiso = usuario.permisos.find((p) => p.modulo === "entregables")
    if (!permiso?.acciones.includes("ver")) {
      res.status(403).json({ message: "No tiene permiso para realizar esta acción." })
      return
    }
  } else {
    await entregablesSvc.verificarPropiedadEmprendedor(idEntregable, usuario.idUsuario)
  }

  res.json(await entregablesSvc.obtenerUrlEvidencia(idEntregable))
})

// No hay DELETE — un entregable rechazado se vuelve a intentar, nunca se
// borra, por eso "entregables" solo tiene ver/anadir/editar en la matriz de permisos.
