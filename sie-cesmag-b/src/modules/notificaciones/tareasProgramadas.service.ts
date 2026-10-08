import { prisma } from "../../lib/prisma.js"
import { enviarCorreo } from "../../lib/correo.js"
import { fechaLegible } from "../../lib/fecha.js"
import { calcularUltimaActividad } from "../../lib/ruta.js"
import { obtenerIntegrantesConCuenta } from "../emprendimientos/emprendimientos.service.js"
import { crearNotificaciones } from "./notificaciones.service.js"

/**
 * Días sin actividad a partir de los cuales se notifica inactividad
 * (RF-11/RF-12) — mismo umbral que ya usaba el badge visual del frontend
 * (`UMBRAL_DIAS_SIN_ACTIVIDAD` en domain/emprendimiento/display.ts).
 */
const UMBRAL_DIAS_SIN_ACTIVIDAD = 15

/** Rango UTC de "mañana" (mismo criterio de anclaje a UTC que el resto del backend, ver lib/horario.ts). */
function rangoDeManana() {
  const hoy = new Date()
  const inicio = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate() + 1))
  const fin = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate() + 2))
  return { inicio, fin }
}

/** Fecha (sin hora) de "mañana", para comparar contra columnas @db.Date como ENTREGABLE.fecha_prevista. */
function fechaDeManana() {
  const hoy = new Date()
  return new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate() + 1))
}

/**
 * RF-34/HU-32: recordatorio, visible solo dentro de la plataforma (el
 * requisito no pide correo aquí), un día antes de que venza un entregable
 * todavía no entregado. Se guarda una sola vez por entregable —si ya existe
 * una notificación de este tipo para él, no se repite aunque la tarea corra
 * varios días seguidos sin que el emprendedor haya entregado.
 */
export async function notificarEntregablesProximos() {
  const entregables = await prisma.entregable.findMany({
    where: { fechaPrevista: fechaDeManana(), estadoActividad: { not: "entregado" } },
    include: { emprendimientoFase: true },
  })

  for (const entregable of entregables) {
    const yaNotificado = await prisma.notificacion.findFirst({
      where: { idEntregable: entregable.idEntregable, tipo: "recordatorio_entregable" },
    })
    if (yaNotificado) continue

    const integrantes = await obtenerIntegrantesConCuenta(entregable.emprendimientoFase.idEmprendimiento)
    if (integrantes.length === 0) continue

    const mensaje = `El entregable "${entregable.titulo}" vence mañana.`
    await crearNotificaciones(
      integrantes.map((i) => ({
        idUsuario: i.idUsuario,
        tipo: "recordatorio_entregable" as const,
        mensaje,
        idEntregable: entregable.idEntregable,
      })),
    )
  }
}

/**
 * RF-33/HU-31: recordatorio, visible solo dentro de la plataforma, un día
 * antes de una asesoría programada — para el emprendedor y para el asesor.
 * Igual que arriba, una sola vez por asesoría.
 */
export async function notificarAsesoriasProximas() {
  const { inicio, fin } = rangoDeManana()
  const asesorias = await prisma.asesoria.findMany({
    where: { fechaAsesoria: { gte: inicio, lt: fin }, estadoAsesoria: "programada" },
    include: {
      agenda: { include: { usuario: true } },
      emprendimientoFase: { include: { emprendimiento: true } },
    },
  })

  for (const asesoria of asesorias) {
    const yaNotificado = await prisma.notificacion.findFirst({
      where: { idAsesoria: asesoria.idAsesoria, tipo: "recordatorio_asesoria" },
    })
    if (yaNotificado) continue

    const asesor = asesoria.agenda.usuario
    const fecha = fechaLegible(asesoria.fechaAsesoria)
    const integrantes = await obtenerIntegrantesConCuenta(asesoria.emprendimientoFase.idEmprendimiento)

    await crearNotificaciones([
      ...integrantes.map((i) => ({
        idUsuario: i.idUsuario,
        tipo: "recordatorio_asesoria" as const,
        mensaje: `Recuerde su asesoría con ${asesor.nombre} mañana, ${fecha}.`,
        idAsesoria: asesoria.idAsesoria,
      })),
      {
        idUsuario: asesor.idUsuario,
        tipo: "recordatorio_asesoria" as const,
        mensaje: `Recuerde su asesoría con ${asesoria.emprendimientoFase.emprendimiento.nombreReferencia} mañana, ${fecha}.`,
        idAsesoria: asesoria.idAsesoria,
      },
    ])
  }
}

/**
 * RF-11/RF-12/HU-15/HU-16: identifica emprendimientos activos sin actividad
 * reciente y notifica a sus integrantes, esta vez sí por correo (es el único
 * de los tres recordatorios que el requisito pide explícitamente por
 * correo). No repite el aviso todos los días una vez notificado dentro del
 * mismo umbral, para no saturar al emprendedor.
 */
export async function notificarInactividad() {
  const activos = await prisma.emprendimiento.findMany({ where: { estado: "activo" } })

  for (const emprendimiento of activos) {
    const ultimaActividad = (await calcularUltimaActividad(emprendimiento.idEmprendimiento)) ?? emprendimiento.fechaIngreso
    const dias = (Date.now() - ultimaActividad.getTime()) / (1000 * 60 * 60 * 24)
    if (dias < UMBRAL_DIAS_SIN_ACTIVIDAD) continue

    const integrantes = await obtenerIntegrantesConCuenta(emprendimiento.idEmprendimiento)
    if (integrantes.length === 0) continue

    const notificadoReciente = await prisma.notificacion.findFirst({
      where: {
        tipo: "inactividad",
        idUsuario: { in: integrantes.map((i) => i.idUsuario) },
        fechaCreacion: { gte: new Date(Date.now() - UMBRAL_DIAS_SIN_ACTIVIDAD * 24 * 60 * 60 * 1000) },
      },
    })
    if (notificadoReciente) continue

    const mensaje = `Su emprendimiento "${emprendimiento.nombreReferencia}" lleva ${Math.floor(dias)} días sin actividad registrada.`
    await crearNotificaciones(
      integrantes.map((i) => ({ idUsuario: i.idUsuario, tipo: "inactividad" as const, mensaje })),
    )
    await Promise.all(
      integrantes.map((i) => enviarCorreo({ para: i.correo, asunto: "Recordatorio de actividad", html: `<p>${mensaje}</p>` })),
    )
  }
}

/**
 * Corre las tres verificaciones diarias. Cada una va en su propio try/catch
 * — que una falle (p. ej. un error de red al enviar un correo) no debe
 * impedir que las otras dos se ejecuten.
 */
export async function ejecutarTareasDiarias() {
  const tareas: [string, () => Promise<void>][] = [
    ["recordatorios de entregables", notificarEntregablesProximos],
    ["recordatorios de asesorías", notificarAsesoriasProximas],
    ["inactividad", notificarInactividad],
  ]
  for (const [nombre, tarea] of tareas) {
    try {
      await tarea()
    } catch (err) {
      console.error(`[tareas programadas] error en "${nombre}":`, err)
    }
  }
}
