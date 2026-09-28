import { Router } from "express"
import { requiereSesion } from "../../middleware/auth.js"
import { prisma } from "../../lib/prisma.js"
import { supabaseAdmin } from "../../lib/supabase.js"
import { usuarioParaFrontend } from "../../lib/mappers.js"
import { obtenerEmprendimientoDeEmprendedor } from "../emprendimientos/emprendimientos.service.js"
import * as asesoriasSvc from "../asesorias/asesorias.service.js"
import { agendarAsesoriaSchema } from "../asesorias/asesorias.schemas.js"
import * as entregablesSvc from "../entregables/entregables.service.js"
import { cargarEvidenciaSchema } from "../entregables/entregables.schemas.js"
import * as emprendedoresSvc from "../emprendedores/emprendedores.service.js"
import { obtenerMiDashboard } from "./mi.service.js"
import { editarMiPerfilAdminSchema, editarMiPerfilSchema } from "./mi.schemas.js"
import { ErrorApi } from "../../middleware/errorHandler.js"

export const rutasMi = Router()

rutasMi.use(requiereSesion)

/** Re-resuelve la sesión a partir del token guardado (nombre/rol/permisos al día). */
rutasMi.get("/sesion", (req, res) => {
  res.json(req.usuario)
})

const incluirRol = { rol: { include: { permisos: true } } } as const

/** "Mi perfil" del portal admin. */
rutasMi.get("/perfil-admin", async (req, res) => {
  const usuario = await prisma.usuario.findUniqueOrThrow({
    where: { idUsuario: req.usuario!.idUsuario },
    include: incluirRol,
  })
  res.json(usuarioParaFrontend(usuario))
})

/**
 * Si cambia el correo, se actualiza también en Supabase Auth (es el
 * identificador de inicio de sesión). Se actualiza ahí primero: si falla
 * (p. ej. ya está registrado por otra cuenta), no se guarda nada en USUARIO.
 */
rutasMi.patch("/perfil-admin", async (req, res) => {
  const { telefono, correo } = editarMiPerfilAdminSchema.parse(req.body)
  const idUsuario = req.usuario!.idUsuario

  if (correo && correo !== req.usuario!.correo) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(idUsuario, {
      email: correo,
      email_confirm: true,
    })
    if (error) {
      throw new ErrorApi(409, "No se pudo actualizar el correo — verifique que no esté ya registrado.")
    }
  }

  const usuario = await prisma.usuario.update({
    where: { idUsuario },
    data: { telefono, correo },
    include: incluirRol,
  })
  res.json(usuarioParaFrontend(usuario))
})

/** El emprendimiento del emprendedor autenticado, en modo solo lectura. */
rutasMi.get("/emprendimiento", async (req, res) => {
  res.json(await obtenerEmprendimientoDeEmprendedor(req.usuario!.idUsuario))
})

/** Asesorías del emprendimiento del emprendedor autenticado. */
rutasMi.get("/asesorias", async (req, res) => {
  res.json(await asesoriasSvc.listarMisAsesorias(req.usuario!.idUsuario))
})

/** Agendar dentro de un horario disponible del equipo administrativo; queda confirmada de inmediato. */
rutasMi.post("/asesorias", async (req, res) => {
  const payload = agendarAsesoriaSchema.parse(req.body)
  res.status(201).json(await asesoriasSvc.agendarAsesoria(req.usuario!.idUsuario, payload))
})

/** Entregables asignados al emprendimiento del emprendedor autenticado. */
rutasMi.get("/entregables", async (req, res) => {
  res.json(await entregablesSvc.listarMisEntregables(req.usuario!.idUsuario))
})

/** Cargar la evidencia de un entregable abierto. */
rutasMi.post("/entregables/:id/evidencia", async (req, res) => {
  const payload = cargarEvidenciaSchema.parse(req.body)
  res.json(await entregablesSvc.cargarEvidencia(req.usuario!.idUsuario, Number(req.params.id), payload))
})

/** Datos personales del emprendedor autenticado. */
rutasMi.get("/perfil", async (req, res) => {
  res.json(await emprendedoresSvc.obtenerMiPerfil(req.usuario!.idUsuario))
})

/** Solo teléfono y programa académico son editables desde aquí. */
rutasMi.patch("/perfil", async (req, res) => {
  const payload = editarMiPerfilSchema.parse(req.body)
  res.json(await emprendedoresSvc.editarMiPerfil(req.usuario!.idUsuario, payload))
})

/** Resumen del panel principal del portal del emprendedor. */
rutasMi.get("/dashboard", async (req, res) => {
  res.json(await obtenerMiDashboard(req.usuario!.idUsuario))
})
