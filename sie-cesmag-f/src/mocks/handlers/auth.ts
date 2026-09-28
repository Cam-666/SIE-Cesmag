import { delay, http, HttpResponse } from "msw"
import type { Credenciales, SesionUsuario } from "@/domain/auth/types"
import { ROLES } from "@/mocks/data/usuarios"

/** Único origen de la matriz de permisos por rol: `ROLES`. */
function permisosDelRol(idRol: number) {
  return ROLES.find((r) => r.idRol === idRol)?.permisos ?? []
}

/**
 * Cuentas de demostración mientras no hay backend real. Ver el hint de
 * login (solo visible en desarrollo) para las credenciales.
 */
const USUARIOS_DEMO: Array<{ credenciales: Credenciales; sesion: SesionUsuario }> = [
  {
    credenciales: { correo: "coordinador@unicesmag.edu.co", contrasena: "cesmag123" },
    sesion: {
      idUsuario: "1",
      nombre: "Carlos Andrés Ruiz",
      correo: "coordinador@unicesmag.edu.co",
      idRol: 1,
      rolNombre: "Coordinador de Emprendimiento",
      ambito: "admin",
      // El coordinador administra permisos; en esta demo tiene acceso total.
      permisos: permisosDelRol(1),
      token: "mock-token-admin",
    },
  },
  {
    credenciales: { correo: "mlopez@unicesmag.edu.co", contrasena: "cesmag123" },
    sesion: {
      idUsuario: "4",
      nombre: "María López",
      correo: "mlopez@unicesmag.edu.co",
      idRol: 3,
      rolNombre: "Empleado",
      ambito: "admin",
      // Permisos acotados: útil para ver la matriz de permisos en acción.
      permisos: permisosDelRol(3),
      token: "mock-token-empleado",
    },
  },
  {
    credenciales: { correo: "jperez@unicesmag.edu.co", contrasena: "cesmag123" },
    sesion: {
      idUsuario: "2",
      nombre: "Juan Sebastián Pérez",
      correo: "jperez@unicesmag.edu.co",
      idRol: 4,
      rolNombre: "Emprendedor",
      ambito: "emprendedor",
      permisos: [],
      token: "mock-token-emprendedor",
    },
  },
]

export const authHandlers = [
  http.post("/api/auth/login", async ({ request }) => {
    await delay(400)
    const body = (await request.json()) as Credenciales
    const encontrado = USUARIOS_DEMO.find(
      (u) =>
        u.credenciales.correo === body.correo && u.credenciales.contrasena === body.contrasena,
    )

    if (!encontrado) {
      return HttpResponse.json({ message: "Credenciales inválidas" }, { status: 401 })
    }

    return HttpResponse.json(encontrado.sesion)
  }),

  http.post("/api/auth/recuperar-password", async () => {
    await delay(400)
    return new HttpResponse(null, { status: 204 })
  }),

  http.post("/api/auth/restablecer-password", async () => {
    await delay(400)
    return new HttpResponse(null, { status: 204 })
  }),
]
