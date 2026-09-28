import { delay, http, HttpResponse } from "msw"
import { ROLES, USUARIOS, RESPONSABLES_ETAPA } from "@/mocks/data/usuarios"
import { ETAPAS } from "@/domain/ruta/catalogo"
import { IDS_ROL_PROTEGIDO } from "@/domain/usuario/display"
import type {
  AsignarResponsablePayload,
  EditarUsuarioPayload,
  EliminarRolPayload,
  NuevoUsuarioPayload,
  ResponsableEtapa,
  RolPayload,
} from "@/domain/usuario/types"

function usuarioConRol(u: (typeof USUARIOS)[number]) {
  return { ...u, rol: ROLES.find((r) => r.idRol === u.idRol) }
}

export const usuariosHandlers = [
  http.get("/api/usuarios", async () => {
    await delay(400)
    return HttpResponse.json(USUARIOS.map(usuarioConRol))
  }),

  http.post("/api/usuarios", async ({ request }) => {
    await delay(400)
    const body = (await request.json()) as NuevoUsuarioPayload
    const nuevo = {
      idUsuario: Date.now(),
      nombre: body.nombre,
      correo: body.correo,
      idRol: body.idRol,
      activo: true,
      fechaCreacion: new Date().toISOString(),
    }
    USUARIOS.unshift(nuevo)
    return HttpResponse.json(usuarioConRol(nuevo), { status: 201 })
  }),

  http.patch("/api/usuarios/:id", async ({ params, request }) => {
    await delay(400)
    const usuario = USUARIOS.find((u) => u.idUsuario === Number(params.id))
    if (!usuario) {
      return HttpResponse.json({ message: "Usuario no encontrado" }, { status: 404 })
    }
    const body = (await request.json()) as EditarUsuarioPayload
    usuario.idRol = body.idRol
    usuario.activo = body.activo
    return HttpResponse.json(usuarioConRol(usuario))
  }),

  http.delete("/api/usuarios/:id", async ({ params }) => {
    await delay(300)
    const indice = USUARIOS.findIndex((u) => u.idUsuario === Number(params.id))
    if (indice === -1) {
      return HttpResponse.json({ message: "Usuario no encontrado" }, { status: 404 })
    }
    if (IDS_ROL_PROTEGIDO.includes(USUARIOS[indice].idRol)) {
      return HttpResponse.json(
        { message: "No se puede eliminar un usuario con rol de Coordinador o Vicerrector" },
        { status: 400 },
      )
    }
    USUARIOS.splice(indice, 1)
    return new HttpResponse(null, { status: 204 })
  }),

  http.get("/api/roles", async () => {
    await delay(400)
    return HttpResponse.json(ROLES)
  }),

  http.post("/api/roles", async ({ request }) => {
    await delay(400)
    const body = (await request.json()) as RolPayload
    const nuevo = {
      idRol: Date.now(),
      nombre: body.nombre,
      descripcion: body.descripcion,
      activo: true,
      ambito: "admin" as const,
      permisos: body.permisos,
      fechaCreacion: new Date().toISOString(),
    }
    ROLES.push(nuevo)
    return HttpResponse.json(nuevo, { status: 201 })
  }),

  http.patch("/api/roles/:id", async ({ params, request }) => {
    await delay(400)
    const rol = ROLES.find((r) => r.idRol === Number(params.id))
    if (!rol) {
      return HttpResponse.json({ message: "Rol no encontrado" }, { status: 404 })
    }
    const body = (await request.json()) as RolPayload
    rol.nombre = body.nombre
    rol.descripcion = body.descripcion
    rol.permisos = body.permisos
    return HttpResponse.json(rol)
  }),

  // USUARIO.id_rol no admite quedar vacío: si el rol tiene usuarios
  // asignados, hay que reasignarlos a `idRolReemplazo` (mismo ámbito)
  // antes de poder borrar el rol.
  http.delete("/api/roles/:id", async ({ params, request }) => {
    await delay(300)
    const idRol = Number(params.id)
    if (IDS_ROL_PROTEGIDO.includes(idRol)) {
      return HttpResponse.json(
        { message: "El rol de Coordinador o Vicerrector no se puede eliminar" },
        { status: 400 },
      )
    }
    const rol = ROLES.find((r) => r.idRol === idRol)
    if (!rol) {
      return HttpResponse.json({ message: "Rol no encontrado" }, { status: 404 })
    }

    const body = (await request.json().catch(() => ({}))) as Partial<EliminarRolPayload>
    const afectados = USUARIOS.filter((u) => u.idRol === idRol)
    if (afectados.length > 0) {
      const reemplazo = body.idRolReemplazo ? ROLES.find((r) => r.idRol === body.idRolReemplazo) : undefined
      if (!reemplazo) {
        return HttpResponse.json(
          { message: "Debe indicar a qué rol reasignar los usuarios que tienen este rol." },
          { status: 400 },
        )
      }
      if (reemplazo.ambito !== rol.ambito) {
        return HttpResponse.json(
          { message: "El rol de reemplazo debe ser del mismo ámbito." },
          { status: 400 },
        )
      }
      afectados.forEach((u) => {
        u.idRol = reemplazo.idRol
      })
    }

    const indice = ROLES.findIndex((r) => r.idRol === idRol)
    ROLES.splice(indice, 1)
    return new HttpResponse(null, { status: 204 })
  }),

  http.get("/api/etapas/responsables", async () => {
    await delay(400)
    const resultado: ResponsableEtapa[] = RESPONSABLES_ETAPA.map((r) => ({
      idEtapa: r.idEtapa,
      idUsuario: r.idUsuario !== null ? String(r.idUsuario) : "",
      usuario: r.idUsuario ? usuarioConRol(USUARIOS.find((u) => u.idUsuario === r.idUsuario)!) : undefined,
    }))
    return HttpResponse.json(resultado)
  }),

  http.put("/api/etapas/:idEtapa/responsable", async ({ params, request }) => {
    await delay(400)
    const idEtapa = Number(params.idEtapa)
    const etapa = ETAPAS.find((e) => e.idEtapa === idEtapa)
    if (!etapa) {
      return HttpResponse.json({ message: "Etapa no encontrada" }, { status: 404 })
    }
    const body = (await request.json()) as AsignarResponsablePayload
    const idUsuarioNumerico = Number(body.idUsuario)
    const asignacion = RESPONSABLES_ETAPA.find((r) => r.idEtapa === idEtapa)
    if (asignacion) {
      asignacion.idUsuario = idUsuarioNumerico
    } else {
      RESPONSABLES_ETAPA.push({ idEtapa, idUsuario: idUsuarioNumerico })
    }
    const usuario = USUARIOS.find((u) => u.idUsuario === idUsuarioNumerico)
    return HttpResponse.json({ idEtapa, idUsuario: body.idUsuario, usuario: usuario && usuarioConRol(usuario) })
  }),

  http.delete("/api/etapas/:idEtapa/responsable", async ({ params }) => {
    await delay(300)
    const idEtapa = Number(params.idEtapa)
    const asignacion = RESPONSABLES_ETAPA.find((r) => r.idEtapa === idEtapa)
    if (asignacion) asignacion.idUsuario = null
    return new HttpResponse(null, { status: 204 })
  }),
]
