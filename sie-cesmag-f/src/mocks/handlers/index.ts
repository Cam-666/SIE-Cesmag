import { authHandlers } from "@/mocks/handlers/auth"
import { indicadoresHandlers } from "@/mocks/handlers/indicadores"
import { emprendimientosHandlers } from "@/mocks/handlers/emprendimientos"
import { asesoriasHandlers } from "@/mocks/handlers/asesorias"
import { entregablesHandlers } from "@/mocks/handlers/entregables"
import { usuariosHandlers } from "@/mocks/handlers/usuarios"
import { miHandlers } from "@/mocks/handlers/mi"
import { miAdminHandlers } from "@/mocks/handlers/mi-admin"
import { agendaHandlers } from "@/mocks/handlers/agenda"
import { formularioHandlers } from "@/mocks/handlers/formulario"
import { notificacionHandlers } from "@/mocks/handlers/notificacion"

export const handlers = [
  ...authHandlers,
  ...indicadoresHandlers,
  ...emprendimientosHandlers,
  ...asesoriasHandlers,
  ...entregablesHandlers,
  ...usuariosHandlers,
  ...miHandlers,
  ...miAdminHandlers,
  ...agendaHandlers,
  ...formularioHandlers,
  ...notificacionHandlers,
]
