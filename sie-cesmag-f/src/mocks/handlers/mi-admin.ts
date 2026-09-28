import { delay, http, HttpResponse } from "msw"
import { ROLES } from "@/mocks/data/usuarios"
import { usuarioActual } from "@/mocks/utils/usuario-actual"
import type { EditarMiPerfilAdminPayload } from "@/domain/usuario/types"

/** "Mi perfil" del portal admin (Coordinador/Vicerrector/Empleado). */
export const miAdminHandlers = [
  http.get("/api/mi/perfil-admin", async ({ request }) => {
    await delay(400)
    const usuario = usuarioActual(request)
    return HttpResponse.json({ ...usuario, rol: ROLES.find((r) => r.idRol === usuario.idRol) })
  }),

  http.patch("/api/mi/perfil-admin", async ({ request }) => {
    await delay(400)
    const usuario = usuarioActual(request)
    const body = (await request.json()) as EditarMiPerfilAdminPayload
    if (body.telefono !== undefined) usuario.telefono = body.telefono
    if (body.correo !== undefined) usuario.correo = body.correo
    return HttpResponse.json({ ...usuario, rol: ROLES.find((r) => r.idRol === usuario.idRol) })
  }),
]
