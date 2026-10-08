import { Router } from "express"
import { requiereSesion } from "../../middleware/auth.js"
import { requierePermiso } from "../../middleware/permisos.js"
import * as usuariosSvc from "../../modules/usuarios-roles/usuarios.service.js"
import * as rolesSvc from "../../modules/usuarios-roles/roles.service.js"
import * as responsablesSvc from "../../modules/usuarios-roles/responsables.service.js"
import {
  asignarResponsableSchema,
  editarUsuarioSchema,
  eliminarRolBodySchema,
  nuevoUsuarioSchema,
  rolPayloadSchema,
} from "../../modules/usuarios-roles/usuarios-roles.schemas.js"

export const rutasUsuariosRoles = Router()

// Todo lo de este módulo exige sesión; cada ruta exige además el permiso
// puntual de la matriz (ver/añadir/editar/eliminar).
rutasUsuariosRoles.use(requiereSesion)

// ---- Usuarios ----
rutasUsuariosRoles.get("/usuarios", requierePermiso("usuarios-roles", "ver"), async (_req, res) => {
  res.json(await usuariosSvc.listarUsuarios())
})

rutasUsuariosRoles.post("/usuarios", requierePermiso("usuarios-roles", "anadir"), async (req, res) => {
  const payload = nuevoUsuarioSchema.parse(req.body)
  res.status(201).json(await usuariosSvc.crearUsuario(payload, req.usuario!))
})

rutasUsuariosRoles.patch("/usuarios/:id", requierePermiso("usuarios-roles", "editar"), async (req, res) => {
  const payload = editarUsuarioSchema.parse(req.body)
  res.json(await usuariosSvc.editarUsuario(String(req.params.id), payload, req.usuario!))
})

rutasUsuariosRoles.delete("/usuarios/:id", requierePermiso("usuarios-roles", "eliminar"), async (req, res) => {
  await usuariosSvc.eliminarUsuario(String(req.params.id), req.usuario!.idUsuario)
  res.status(204).end()
})

// ---- Roles ----
rutasUsuariosRoles.get("/roles", requierePermiso("usuarios-roles", "ver"), async (_req, res) => {
  res.json(await rolesSvc.listarRoles())
})

rutasUsuariosRoles.post("/roles", requierePermiso("usuarios-roles", "anadir"), async (req, res) => {
  const payload = rolPayloadSchema.parse(req.body)
  res.status(201).json(await rolesSvc.crearRol(payload, req.usuario!))
})

rutasUsuariosRoles.patch("/roles/:id", requierePermiso("usuarios-roles", "editar"), async (req, res) => {
  const payload = rolPayloadSchema.parse(req.body)
  res.json(await rolesSvc.editarRol(Number(req.params.id), payload, req.usuario!))
})

rutasUsuariosRoles.delete("/roles/:id", requierePermiso("usuarios-roles", "eliminar"), async (req, res) => {
  const { idRolReemplazo } = eliminarRolBodySchema.parse(req.body ?? {})
  await rolesSvc.eliminarRol(Number(req.params.id), idRolReemplazo, req.usuario!)
  res.status(204).end()
})

// ---- Responsables por etapa ----
rutasUsuariosRoles.get(
  "/etapas/responsables",
  requierePermiso("usuarios-roles", "ver"),
  async (_req, res) => {
    res.json(await responsablesSvc.listarResponsables())
  },
)

rutasUsuariosRoles.put(
  "/etapas/:idEtapa/responsable",
  requierePermiso("usuarios-roles", "editar"),
  async (req, res) => {
    const { idUsuario } = asignarResponsableSchema.parse(req.body)
    res.json(await responsablesSvc.asignarResponsable(Number(req.params.idEtapa), idUsuario))
  },
)

rutasUsuariosRoles.delete(
  "/etapas/:idEtapa/responsable",
  requierePermiso("usuarios-roles", "eliminar"),
  async (req, res) => {
    await responsablesSvc.eliminarResponsable(Number(req.params.idEtapa))
    res.status(204).end()
  },
)
