import { http, HttpResponse, passthrough } from "msw"

/**
 * El mock de autenticación del proyecto (src/mocks/handlers/auth.ts) solo
 * trae cuentas demo para Coordinador, Administrativo y Emprendedor — no para
 * Vicerrector. En vez de tocar ese archivo (es código del proyecto, fuera
 * del alcance permitido para esta suite), esta capa SOLO PARA PRUEBAS añade
 * esa cuenta por encima del handler real de login. Reutiliza el
 * idUsuario/correo/rol reales de "Fernando Ortega" (mocks/data/usuarios.ts)
 * y los mismos permisos que ya tiene sembrado ese rol ahí (idénticos a los
 * de Coordinador: el conjunto completo de ACCIONES_DISPONIBLES_POR_MODULO).
 */
const CORREO = "fortega@unicesmag.edu.co"
const CONTRASENA = "cesmag123"

export const CREDENCIALES_VICERRECTOR = { correo: CORREO, contrasena: CONTRASENA }

export const handlerLoginVicerrector = http.post("/api/auth/login", async ({ request }) => {
  const body = (await request.clone().json()) as { correo?: string; contrasena?: string }
  if (body.correo !== CORREO || body.contrasena !== CONTRASENA) {
    return passthrough()
  }
  return HttpResponse.json({
    idUsuario: "3",
    nombre: "Fernando Ortega",
    correo: CORREO,
    idRol: 2,
    rolNombre: "Vicerrector de Investigación",
    ambito: "admin",
    permisos: [
      { modulo: "dashboard", acciones: ["ver"] },
      { modulo: "emprendimientos", acciones: ["ver", "anadir", "editar", "eliminar"] },
      { modulo: "asesorias", acciones: ["ver", "anadir", "editar", "eliminar"] },
      { modulo: "entregables", acciones: ["ver", "anadir", "editar"] },
      { modulo: "reportes", acciones: ["ver"] },
      { modulo: "usuarios-roles", acciones: ["ver", "anadir", "editar", "eliminar"] },
    ],
    token: "mock-token-vicerrector",
    refreshToken: "mock-refresh-vicerrector",
  })
})
