import type { Notificacion } from "@/domain/notificacion/types"
import { persistir } from "@/mocks/storage"

/**
 * `Notificacion` (ER) no tiene `idUsuario`; en el mock se resuelven dos
 * listas separadas y el handler decide cuál devolver según el token de la
 * cuenta demo autenticada (ver `mocks/handlers/notificacion.ts`).
 */
export const NOTIFICACIONES_ADMIN: Notificacion[] = persistir("notificaciones-admin", [
  {
    idNotificacion: 1,
    idAsesoria: 4,
    idEntregable: null,
    tipo: "recordatorio_asesoria",
    mensaje: "Tiene una asesoría con PetConnect mañana a las 9:00 a. m.",
    leido: false,
    fechaCreacion: "2026-09-17T08:00:00",
  },
  {
    idNotificacion: 2,
    idAsesoria: 2,
    idEntregable: null,
    tipo: "agendamiento_asesoria",
    mensaje: "Diseño & Estilo agendó una asesoría para el 17/09 a las 4:00 p. m.",
    leido: true,
    fechaCreacion: "2026-09-15T11:20:00",
  },
])

export const NOTIFICACIONES_EMPRENDEDOR: Notificacion[] = persistir("notificaciones-emprendedor", [
  {
    idNotificacion: 101,
    idAsesoria: 5,
    idEntregable: null,
    tipo: "recordatorio_asesoria",
    mensaje: "Tiene una asesoría con María López mañana a las 10:00 a. m.",
    leido: false,
    fechaCreacion: "2026-09-18T08:00:00",
  },
  {
    idNotificacion: 102,
    idAsesoria: null,
    idEntregable: 1,
    tipo: "recordatorio_entregable",
    mensaje: "Su entregable \"Prototipo de baja fidelidad\" vence pronto (28/09).",
    leido: false,
    fechaCreacion: "2026-09-17T09:00:00",
  },
  {
    idNotificacion: 103,
    idAsesoria: null,
    idEntregable: 2,
    tipo: "resultado_revision",
    mensaje: "Su entregable \"Declaración de reto estructurada.pdf\" fue aprobado.",
    leido: true,
    fechaCreacion: "2026-08-19T10:05:00",
  },
])
