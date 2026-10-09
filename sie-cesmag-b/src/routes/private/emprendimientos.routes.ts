import { Router } from "express"
import { requiereSesion } from "../../middleware/auth.js"
import { requierePermiso } from "../../middleware/permisos.js"
import { etapasResponsableDe } from "../../lib/alcanceResponsable.js"
import * as emprendimientosSvc from "../../modules/emprendimientos/emprendimientos.service.js"
import * as integrantesSvc from "../../modules/emprendimientos/integrantes.service.js"
import {
  agregarIntegranteSchema,
  cambioEstadoSchema,
  caracterizacionSchema,
  crearEmprendimientoSchema,
  diagnosticoInicialSchema,
  editarIntegranteSchema,
  filtrosEmprendimientosSchema,
  reingresoSchema,
} from "../../modules/emprendimientos/emprendimientos.schemas.js"

export const rutasEmprendimientos = Router()

rutasEmprendimientos.use(requiereSesion)

/** Listado de emprendimientos, con filtros. Restringido por etapa si el usuario es responsable de alguna. */
rutasEmprendimientos.get("/emprendimientos", requierePermiso("emprendimientos", "ver"), async (req, res) => {
  const filtros = filtrosEmprendimientosSchema.parse(req.query)
  const idsEtapaResponsable = await etapasResponsableDe(req.usuario!.idUsuario)
  res.json(await emprendimientosSvc.listarEmprendimientos(filtros, idsEtapaResponsable))
})

/** Crear un emprendimiento directamente, fuera del flujo de aprobar precandidato. */
rutasEmprendimientos.post("/emprendimientos", requierePermiso("emprendimientos", "anadir"), async (req, res) => {
  const payload = crearEmprendimientoSchema.parse(req.body)
  res.status(201).json(await emprendimientosSvc.crearEmprendimiento(payload))
})

/** Detalle completo de un emprendimiento, incluida su ruta metodológica. */
rutasEmprendimientos.get("/emprendimientos/:id", requierePermiso("emprendimientos", "ver"), async (req, res) => {
  const idsEtapaResponsable = await etapasResponsableDe(req.usuario!.idUsuario)
  res.json(await emprendimientosSvc.obtenerDetalle(Number(req.params.id), idsEtapaResponsable))
})

/** Cambia el estado general del emprendimiento (activo/inactivo/terminado). */
rutasEmprendimientos.patch(
  "/emprendimientos/:id/estado",
  requierePermiso("emprendimientos", "editar"),
  async (req, res) => {
    const payload = cambioEstadoSchema.parse(req.body)
    res.json(await emprendimientosSvc.cambiarEstado(Number(req.params.id), payload))
  },
)

/** Registra el reingreso de un emprendimiento inactivo. */
rutasEmprendimientos.post(
  "/emprendimientos/:id/reingreso",
  requierePermiso("emprendimientos", "editar"),
  async (req, res) => {
    const { fechaReingreso } = reingresoSchema.parse(req.body)
    res.json(await emprendimientosSvc.registrarReingreso(Number(req.params.id), fechaReingreso))
  },
)

/** Registra el diagnóstico inicial y genera la ruta de fases del emprendimiento. */
rutasEmprendimientos.post(
  "/emprendimientos/:id/diagnostico-inicial",
  requierePermiso("emprendimientos", "editar"),
  async (req, res) => {
    const { situacionActual, idEtapaIngreso } = diagnosticoInicialSchema.parse(req.body)
    res.json(await emprendimientosSvc.registrarDiagnosticoInicial(Number(req.params.id), situacionActual, idEtapaIngreso))
  },
)

/** Aprobar cumplimiento de la fase en curso y avanzar a la siguiente. */
rutasEmprendimientos.post(
  "/emprendimientos/:id/avanzar-fase",
  requierePermiso("emprendimientos", "editar"),
  async (req, res) => {
    await emprendimientosSvc.avanzarFase(Number(req.params.id))
    res.status(204).end()
  },
)

/** Edita las respuestas de caracterización del emprendimiento. */
rutasEmprendimientos.patch(
  "/emprendimientos/:id/caracterizacion",
  requierePermiso("emprendimientos", "editar"),
  async (req, res) => {
    const datos = caracterizacionSchema.parse(req.body)
    res.json(await emprendimientosSvc.editarCaracterizacion(Number(req.params.id), datos))
  },
)

/** Crea una fila nueva (la membresía), por eso pide "añadir" y no "editar". */
rutasEmprendimientos.post(
  "/emprendimientos/:id/integrantes",
  requierePermiso("emprendimientos", "anadir"),
  async (req, res) => {
    const payload = agregarIntegranteSchema.parse(req.body)
    res.status(201).json(await integrantesSvc.agregarIntegrante(Number(req.params.id), payload))
  },
)

rutasEmprendimientos.patch(
  "/emprendimientos/:id/integrantes/:idUsuario",
  requierePermiso("emprendimientos", "editar"),
  async (req, res) => {
    const { nombre } = editarIntegranteSchema.parse(req.body)
    res.json(await integrantesSvc.editarIntegrante(Number(req.params.id), String(req.params.idUsuario), nombre))
  },
)

rutasEmprendimientos.delete(
  "/emprendimientos/:id/integrantes/:idUsuario",
  requierePermiso("emprendimientos", "eliminar"),
  async (req, res) => {
    await integrantesSvc.eliminarIntegrante(Number(req.params.id), String(req.params.idUsuario))
    res.status(204).end()
  },
)
