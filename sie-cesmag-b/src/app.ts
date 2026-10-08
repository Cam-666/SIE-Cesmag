// Punto de ensamblaje del servidor: monta cada módulo como un router
// independiente bajo /api. La lógica de negocio vive en los módulos
// (carpetas de src/modules/*); las rutas se agrupan en src/routes/public (sin sesión)
// y src/routes/private (con sesión). Este archivo solo los conecta entre sí.
import express from "express"
import cors from "cors"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import { rutasAuth } from "./routes/public/auth.routes.js"
import { rutasMi } from "./routes/private/mi.routes.js"
import { rutasUsuariosRoles } from "./routes/private/usuarios-roles.routes.js"
import { rutasFormularioPublico } from "./routes/public/formulario.routes.js"
import { rutasFormulario } from "./routes/private/formulario.routes.js"
import { rutasEmprendimientos } from "./routes/private/emprendimientos.routes.js"
import { rutasAgenda } from "./routes/private/agenda.routes.js"
import { rutasAsesorias } from "./routes/private/asesorias.routes.js"
import { rutasEntregables } from "./routes/private/entregables.routes.js"
import { rutasNotificaciones } from "./routes/private/notificaciones.routes.js"
import { rutasIndicadores } from "./routes/private/indicadores.routes.js"
import { manejadorErrores } from "./middleware/errorHandler.js"

/**
 * Orígenes del frontend que pueden llamar a la API desde el navegador. Se leen
 * de FRONTEND_URL (varios separados por coma). Las peticiones sin cabecera
 * Origin (Apps Script, herramientas como curl) no pasan por CORS.
 */
function origenesPermitidos(): string[] {
  return (process.env.FRONTEND_URL ?? "")
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean)
}

/** Respuesta uniforme cuando un cliente excede su cupo de peticiones. */
function limitador(maximo: number, ventanaMinutos: number, mensaje: string) {
  return rateLimit({
    windowMs: ventanaMinutos * 60 * 1000,
    limit: maximo,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { message: mensaje },
  })
}

export function crearApp() {
  const app = express()

  // Railway (y cualquier proxy) reenvía la IP real del cliente en X-Forwarded-For;
  // sin esto, todos los usuarios compartirían un mismo cupo de peticiones.
  app.set("trust proxy", 1)

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }))
  app.use(
    cors({
      origin: (origen, callback) => {
        if (!origen || origenesPermitidos().includes(origen)) {
          callback(null, true)
          return
        }
        callback(null, false)
      },
    }),
  )

  // Cupo general generoso para toda la API, más estricto donde hay riesgo de
  // fuerza bruta (login) o de abuso de correo (recuperación de contraseña).
  app.use("/api", limitador(300, 15, "Demasiadas peticiones. Intente de nuevo en unos minutos."))
  app.use("/api/auth/login", limitador(10, 15, "Demasiados intentos de inicio de sesión. Intente más tarde."))
  app.use(
    ["/api/auth/recuperar-password", "/api/auth/restablecer-password"],
    limitador(5, 15, "Demasiadas solicitudes. Intente más tarde."),
  )
  app.use("/api/formulario/respuestas", limitador(100, 15, "Demasiadas respuestas recibidas. Intente más tarde."))

  app.use(express.json({ limit: "100kb" }))

  app.get("/api/salud", (_req, res) => res.json({ ok: true }))

  app.use("/api/auth", rutasAuth)
  // Va primero: es la única ruta bajo "/api" sin `requiereSesion" — si
  // quedara detrás de un router con sesión "de bloque" (ver el comentario
  // en routes/public/formulario.routes.ts), quedaría exigiendo sesión sin querer.
  app.use("/api", rutasFormularioPublico)
  app.use("/api/mi", rutasMi)
  app.use("/api", rutasUsuariosRoles)
  app.use("/api", rutasFormulario)
  app.use("/api", rutasEmprendimientos)
  app.use("/api", rutasAgenda)
  app.use("/api", rutasAsesorias)
  app.use("/api", rutasEntregables)
  app.use("/api", rutasNotificaciones)
  app.use("/api", rutasIndicadores)

  // Siempre al final: captura cualquier error lanzado (o promesa rechazada,
  // Express 5 las reenvía solo) en las rutas de arriba.
  app.use(manejadorErrores)

  return app
}
