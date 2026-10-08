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
      refreshToken: "mock-refresh-admin",
    },
  },
  {
    credenciales: { correo: "mlopez@unicesmag.edu.co", contrasena: "cesmag123" },
    sesion: {
      idUsuario: "4",
      nombre: "María López",
      correo: "mlopez@unicesmag.edu.co",
      idRol: 3,
      rolNombre: "Administrativo",
      ambito: "admin",
      // Permisos acotados: útil para ver la matriz de permisos en acción.
      permisos: permisosDelRol(3),
      token: "mock-token-empleado",
      refreshToken: "mock-refresh-empleado",
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
      refreshToken: "mock-refresh-emprendedor",
    },
  },
]

/** El mock no distingue token por usuario fuera de login: busca por `idUsuario` codificado en el token (ver `usuario-actual.ts`). */
function sesionPorToken(request: Request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "") ?? null
  return USUARIOS_DEMO.find((u) => u.sesion.token === token)?.sesion ?? null
}

export const authHandlers = [
  http.get("/api/auth/me", async ({ request }) => {
    await delay(200)
    const sesion = sesionPorToken(request)
    if (!sesion) {
      return HttpResponse.json({ message: "No autenticado." }, { status: 401 })
    }
    const resto: Omit<SesionUsuario, "token" | "refreshToken"> = {
      idUsuario: sesion.idUsuario,
      nombre: sesion.nombre,
      correo: sesion.correo,
      idRol: sesion.idRol,
      rolNombre: sesion.rolNombre,
      ambito: sesion.ambito,
      permisos: sesion.permisos,
    }
    return HttpResponse.json(resto)
  }),

  /** El refresh token del mock nunca expira — basta con devolver la misma sesión. */
  http.post("/api/auth/refrescar", async ({ request }) => {
    await delay(300)
    const body = (await request.json()) as { refreshToken: string }
    const encontrado = USUARIOS_DEMO.find((u) => u.sesion.refreshToken === body.refreshToken)
    if (!encontrado) {
      return HttpResponse.json({ message: "La sesión expiró. Inicie sesión de nuevo." }, { status: 401 })
    }
    return HttpResponse.json(encontrado.sesion)
  }),

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
