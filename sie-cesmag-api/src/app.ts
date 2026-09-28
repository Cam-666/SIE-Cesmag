import express from "express"
import cors from "cors"
import { rutasAuth } from "./modules/auth/auth.routes.js"
import { rutasMi } from "./modules/mi/mi.routes.js"
import { rutasUsuariosRoles } from "./modules/usuarios-roles/usuarios-roles.routes.js"
import { rutasFormulario, rutasFormularioPublico } from "./modules/formulario/formulario.routes.js"
import { rutasEmprendimientos } from "./modules/emprendimientos/emprendimientos.routes.js"
import { rutasAgenda } from "./modules/agenda/agenda.routes.js"
import { rutasAsesorias } from "./modules/asesorias/asesorias.routes.js"
import { rutasEntregables } from "./modules/entregables/entregables.routes.js"
import { rutasNotificaciones } from "./modules/notificaciones/notificaciones.routes.js"
import { manejadorErrores } from "./middleware/errorHandler.js"

export function crearApp() {
  const app = express()

  app.use(cors())
  app.use(express.json())

  app.get("/api/salud", (_req, res) => res.json({ ok: true }))

  app.use("/api/auth", rutasAuth)
  // Va primero: es la única ruta bajo "/api" sin `requiereSesion" — si
  // quedara detrás de un router con sesión "de bloque" (ver el comentario
  // en formulario.routes.ts), quedaría exigiendo sesión sin querer.
  app.use("/api", rutasFormularioPublico)
  app.use("/api/mi", rutasMi)
  app.use("/api", rutasUsuariosRoles)
  app.use("/api", rutasFormulario)
  app.use("/api", rutasEmprendimientos)
  app.use("/api", rutasAgenda)
  app.use("/api", rutasAsesorias)
  app.use("/api", rutasEntregables)
  app.use("/api", rutasNotificaciones)

  // Siempre al final: captura cualquier error lanzado (o promesa rechazada,
  // Express 5 las reenvía solo) en las rutas de arriba.
  app.use(manejadorErrores)

  return app
}
