import { Prisma, type EstadoAsesoria } from "@prisma/client"
import { prisma } from "../../lib/prisma.js"
import { combinarFechaHora } from "../../lib/horario.js"
import { enviarCorreo } from "../../lib/correo.js"
import { fechaLegible } from "../../lib/fecha.js"
import {
  obtenerIntegrantesConCuenta,
  resolverIdEmprendimientoDeEmprendedor,
} from "../emprendimientos/emprendimientos.service.js"
import { crearNotificaciones } from "../notificaciones/notificaciones.service.js"
import { resolverCadenaDeBloques, resolverCadenaReservada } from "../agenda/agenda.service.js"
import { ErrorApi } from "../../middleware/errorHandler.js"

const incluirParaListado = {
  agenda: { include: { usuario: true } },
  emprendimientoFase: { include: { emprendimiento: true } },
} satisfies Prisma.AsesoriaInclude

const incluirParaHistorial = {
  agenda: { include: { usuario: true } },
  emprendimientoFase: { include: { fase: true } },
} satisfies Prisma.AsesoriaInclude

type AsesoriaListadoRow = Prisma.AsesoriaGetPayload<{ include: typeof incluirParaListado }>
type AsesoriaHistorialRow = Prisma.AsesoriaGetPayload<{ include: typeof incluirParaHistorial }>

interface ActividadAsesoria {
  descripcion: string
  responsable: string
  cumplido: boolean
}

/** Proyección compartida por el listado general, "mis asesorías" y las mutaciones. */
function asesoriaAListado(a: AsesoriaListadoRow) {
  return {
    idAsesoria: a.idAsesoria,
    fechaAsesoria: a.fechaAsesoria.toISOString(),
    emprendimiento: a.emprendimientoFase.emprendimiento.nombreReferencia,
    asesor: a.agenda.usuario.nombre,
    tipoAsesoria: a.tipoAsesoria,
    modalidad: a.modalidad,
    estadoAsesoria: a.estadoAsesoria,
    avance: a.avance,
    observaciones: a.observaciones,
    idAgenda: a.idAgenda,
    duracionMinutos: a.duracionMinutos,
  }
}

/** Proyección para el histórico de asesorías del detalle de un emprendimiento. */
function asesoriaAHistorial(a: AsesoriaHistorialRow) {
  return {
    idAsesoria: a.idAsesoria,
    fechaAsesoria: a.fechaAsesoria.toISOString(),
    asesor: a.agenda.usuario.nombre,
    faseNombre: `${a.emprendimientoFase.fase.numero}. ${a.emprendimientoFase.fase.nombre}`,
    titulo: a.titulo,
    estadoAsesoria: a.estadoAsesoria,
    avance: a.avance,
    actividades: (a.actividades as unknown as ActividadAsesoria[] | null) ?? [],
  }
}

/**
 * Avisa del agendamiento a ambas partes (RF-31/HU-29): correo a las dos
 * siempre, y notificación dentro de la plataforma solo a quien NO acaba de
 * hacer la acción — quien agenda ya ve el resultado en pantalla, no hace
 * falta duplicarlo en su propia campana.
 */
async function notificarAgendamiento(
  asesoria: AsesoriaListadoRow,
  idEmprendimiento: number,
  opciones: { notificarAsesorEnApp: boolean; notificarEmprendedoresEnApp: boolean },
) {
  const fecha = fechaLegible(asesoria.fechaAsesoria)
  const asesor = asesoria.agenda.usuario
  const integrantes = await obtenerIntegrantesConCuenta(idEmprendimiento)

  const mensajeEmprendedor = `Se agendó una asesoría con ${asesor.nombre} para el ${fecha}.`
  const mensajeAsesor = `Se agendó una asesoría con ${asesoria.emprendimientoFase.emprendimiento.nombreReferencia} para el ${fecha}.`

  await crearNotificaciones([
    ...(opciones.notificarEmprendedoresEnApp
      ? integrantes.map((i) => ({
          idUsuario: i.idUsuario,
          tipo: "agendamiento_asesoria" as const,
          mensaje: mensajeEmprendedor,
          idAsesoria: asesoria.idAsesoria,
        }))
      : []),
    ...(opciones.notificarAsesorEnApp
      ? [{ idUsuario: asesor.idUsuario, tipo: "agendamiento_asesoria" as const, mensaje: mensajeAsesor, idAsesoria: asesoria.idAsesoria }]
      : []),
  ])

  await Promise.all([
    ...integrantes.map((i) => enviarCorreo({ para: i.correo, asunto: "Asesoría agendada", html: `<p>${mensajeEmprendedor}</p>` })),
    enviarCorreo({ para: asesor.correo, asunto: "Asesoría agendada", html: `<p>${mensajeAsesor}</p>` }),
  ])
}

/** Avisa de una cancelación o reprogramación a ambas partes (RF-32/HU-30), correo incluido. */
async function notificarCambioAsesoria(
  asesoria: AsesoriaListadoRow,
  idEmprendimiento: number,
  accion: "cancelar" | "reprogramar",
) {
  const fecha = fechaLegible(asesoria.fechaAsesoria)
  const asesor = asesoria.agenda.usuario
  const integrantes = await obtenerIntegrantesConCuenta(idEmprendimiento)
  const verbo = accion === "cancelar" ? "cancelada" : "reprogramada"

  const mensajeEmprendedor =
    accion === "cancelar"
      ? `Su asesoría con ${asesor.nombre} fue cancelada.`
      : `Su asesoría con ${asesor.nombre} fue reprogramada para el ${fecha}.`
  const mensajeAsesor =
    accion === "cancelar"
      ? `La asesoría con ${asesoria.emprendimientoFase.emprendimiento.nombreReferencia} fue cancelada.`
      : `La asesoría con ${asesoria.emprendimientoFase.emprendimiento.nombreReferencia} fue reprogramada para el ${fecha}.`

  await crearNotificaciones([
    ...integrantes.map((i) => ({
      idUsuario: i.idUsuario,
      tipo: "agendamiento_asesoria" as const,
      mensaje: mensajeEmprendedor,
      idAsesoria: asesoria.idAsesoria,
    })),
    { idUsuario: asesor.idUsuario, tipo: "agendamiento_asesoria" as const, mensaje: mensajeAsesor, idAsesoria: asesoria.idAsesoria },
  ])

  await Promise.all([
    ...integrantes.map((i) => enviarCorreo({ para: i.correo, asunto: `Asesoría ${verbo}`, html: `<p>${mensajeEmprendedor}</p>` })),
    enviarCorreo({ para: asesor.correo, asunto: `Asesoría ${verbo}`, html: `<p>${mensajeAsesor}</p>` }),
  ])
}

/**
 * ASESORIA.titulo es obligatorio (VarChar(200)) pero ningún formulario del
 * frontend pide un título — se genera automáticamente a partir del tipo y la fase.
 */
function generarTitulo(tipoAsesoria: "diagnostica" | "seguimiento", faseNombre: string) {
  const prefijo = tipoAsesoria === "diagnostica" ? "Asesoría diagnóstica" : "Asesoría de seguimiento"
  return `${prefijo} · ${faseNombre}`.slice(0, 200)
}

/**
 * Resuelve a qué EMPRENDIMIENTO_FASE queda asociada una nueva asesoría: el
 * modelo exige una fila concreta de la ruta, pero quien agenda solo indica
 * (a lo sumo) una etapa, nunca una fase puntual. Dentro del alcance resuelto
 * (la etapa indicada si la hay, si no toda la ruta) se prefiere la fase
 * "en_curso"; si no hay ninguna ahí, la primera "pendiente"; si tampoco, la
 * última "completada". Si el emprendimiento todavía no tiene ninguna fila de
 * EMPRENDIMIENTO_FASE, no hay nada que asociar y se corta con un 400 explícito.
 */
async function resolverFaseObjetivo(idEmprendimiento: number, idEtapaIdentificada?: number | null) {
  const fases = await prisma.emprendimientoFase.findMany({
    where: { idEmprendimiento },
    include: { fase: true },
    orderBy: { fase: { numero: "asc" } },
  })
  if (fases.length === 0) {
    throw new ErrorApi(
      400,
      "Este emprendimiento todavía no tiene un diagnóstico inicial registrado. Regístrelo antes de agendar una asesoría.",
    )
  }

  const candidatas = idEtapaIdentificada ? fases.filter((f) => f.fase.idEtapa === idEtapaIdentificada) : fases
  const conjunto = candidatas.length > 0 ? candidatas : fases

  return (
    conjunto.find((f) => f.estadoFase === "en_curso") ??
    conjunto.find((f) => f.estadoFase === "pendiente") ??
    conjunto[conjunto.length - 1]
  )
}

/** Listado general de asesorías. */
export async function listarAsesorias(filtros: { estado?: string }) {
  const asesorias = await prisma.asesoria.findMany({
    where: filtros.estado && filtros.estado !== "todos" ? { estadoAsesoria: filtros.estado as EstadoAsesoria } : {},
    include: incluirParaListado,
    orderBy: { fechaAsesoria: "desc" },
  })
  return asesorias.map(asesoriaAListado)
}

/**
 * Asesorías propias del usuario administrativo autenticado, como asesor —
 * para su calendario personal (Mi perfil), a diferencia del listado general
 * de "Asesorías" (que sí muestra las de todo el equipo, según permisos). No
 * exige un permiso de módulo: es inherentemente la vista "de uno mismo",
 * igual que "Mi disponibilidad".
 */
export async function listarMisAsesoriasComoAsesor(idUsuarioAsesor: string) {
  const asesorias = await prisma.asesoria.findMany({
    where: { agenda: { idUsuario: idUsuarioAsesor } },
    include: incluirParaListado,
    orderBy: { fechaAsesoria: "desc" },
  })
  return asesorias.map(asesoriaAListado)
}

/** Historial de asesorías de un emprendimiento. */
export async function listarHistorialPorEmprendimiento(idEmprendimiento: number) {
  const asesorias = await prisma.asesoria.findMany({
    where: { emprendimientoFase: { idEmprendimiento } },
    include: incluirParaHistorial,
    orderBy: { fechaAsesoria: "desc" },
  })
  return asesorias.map(asesoriaAHistorial)
}

/** Asesorías del emprendimiento del emprendedor autenticado. */
export async function listarMisAsesorias(idUsuarioEmprendedor: string) {
  const idEmprendimiento = await resolverIdEmprendimientoDeEmprendedor(idUsuarioEmprendedor)
  const asesorias = await prisma.asesoria.findMany({
    where: { emprendimientoFase: { idEmprendimiento } },
    include: incluirParaListado,
    orderBy: { fechaAsesoria: "desc" },
  })
  return asesorias.map(asesoriaAListado)
}

/**
 * El coordinador/empleado agenda una asesoría dentro de un bloque disponible
 * de su propia agenda — se verifica que el bloque sea realmente suyo, no
 * solo que exista.
 */
export async function crearAsesoria(
  idUsuarioActor: string,
  payload: {
    idEmprendimiento: number
    idAgenda: number
    duracionMinutos: number
    tipoAsesoria: "diagnostica" | "seguimiento"
    modalidad: "presencial" | "virtual"
    etapaIdentificada?: number | null
  },
) {
  const ancla = await prisma.agenda.findUnique({ where: { idAgenda: payload.idAgenda } })
  if (!ancla) {
    throw new ErrorApi(404, "El horario seleccionado no existe.")
  }
  if (ancla.idUsuario !== idUsuarioActor) {
    throw new ErrorApi(403, "Solo puede agendar dentro de su propia disponibilidad.")
  }
  const cadena = await resolverCadenaDeBloques(payload.idAgenda, payload.duracionMinutos)

  const emprendimiento = await prisma.emprendimiento.findUnique({ where: { idEmprendimiento: payload.idEmprendimiento } })
  if (!emprendimiento) {
    throw new ErrorApi(404, "Emprendimiento no encontrado.")
  }

  const faseObjetivo = await resolverFaseObjetivo(payload.idEmprendimiento, payload.etapaIdentificada)

  const [creada] = await prisma.$transaction([
    prisma.asesoria.create({
      data: {
        idEmprendimientoFase: faseObjetivo.idEmprendimientoFase,
        idAgenda: ancla.idAgenda,
        duracionMinutos: payload.duracionMinutos,
        tipoAsesoria: payload.tipoAsesoria,
        titulo: generarTitulo(payload.tipoAsesoria, faseObjetivo.fase.nombre),
        fechaAsesoria: combinarFechaHora(ancla.fecha, ancla.horaInicio),
        modalidad: payload.modalidad,
        estadoAsesoria: "programada",
      },
      include: incluirParaListado,
    }),
    prisma.agenda.updateMany({
      where: { idAgenda: { in: cadena.map((b) => b.idAgenda) } },
      data: { estado: "reservado" },
    }),
  ])

  await notificarAgendamiento(creada, payload.idEmprendimiento, {
    notificarAsesorEnApp: false,
    notificarEmprendedoresEnApp: true,
  })

  return asesoriaAListado(creada)
}

/**
 * El emprendedor agenda dentro de un bloque disponible de cualquier miembro
 * del equipo administrativo; queda confirmada de inmediato. No hay un campo
 * de título/nota aparte de `motivo`, que se guarda en `observaciones`.
 */
export async function agendarAsesoria(
  idUsuarioEmprendedor: string,
  payload: {
    idAgenda: number
    duracionMinutos: number
    tipoAsesoria: "diagnostica" | "seguimiento"
    modalidad: "presencial" | "virtual"
    motivo: string
  },
) {
  const idEmprendimiento = await resolverIdEmprendimientoDeEmprendedor(idUsuarioEmprendedor)

  const asesoriaPendiente = await prisma.asesoria.findFirst({
    where: { emprendimientoFase: { idEmprendimiento }, estadoAsesoria: "programada" },
  })
  if (asesoriaPendiente) {
    throw new ErrorApi(
      409,
      "Ya tiene una asesoría programada pendiente de resultado. Debe esperar a que el asesor la registre (o cancelarla) antes de agendar otra.",
    )
  }

  const cadena = await resolverCadenaDeBloques(payload.idAgenda, payload.duracionMinutos)
  const ancla = cadena[0]

  const faseObjetivo = await resolverFaseObjetivo(idEmprendimiento)

  const [creada] = await prisma.$transaction([
    prisma.asesoria.create({
      data: {
        idEmprendimientoFase: faseObjetivo.idEmprendimientoFase,
        idAgenda: ancla.idAgenda,
        duracionMinutos: payload.duracionMinutos,
        tipoAsesoria: payload.tipoAsesoria,
        titulo: generarTitulo(payload.tipoAsesoria, faseObjetivo.fase.nombre),
        fechaAsesoria: combinarFechaHora(ancla.fecha, ancla.horaInicio),
        modalidad: payload.modalidad,
        observaciones: payload.motivo,
        estadoAsesoria: "programada",
      },
      include: incluirParaListado,
    }),
    prisma.agenda.updateMany({
      where: { idAgenda: { in: cadena.map((b) => b.idAgenda) } },
      data: { estado: "reservado" },
    }),
  ])

  await notificarAgendamiento(creada, idEmprendimiento, {
    notificarAsesorEnApp: true,
    notificarEmprendedoresEnApp: false,
  })

  return asesoriaAListado(creada)
}

/** Cancela (libera el bloque) o reprograma (lo cambia por otro disponible). */
export async function cancelarOReprogramar(
  idAsesoria: number,
  payload: { accion: "cancelar"; motivo: string } | { accion: "reprogramar"; nuevoIdAgenda: number },
) {
  const asesoria = await prisma.asesoria.findUnique({ where: { idAsesoria }, include: { emprendimientoFase: true } })
  if (!asesoria) {
    throw new ErrorApi(404, "Asesoría no encontrada.")
  }
  if (asesoria.estadoAsesoria !== "programada") {
    throw new ErrorApi(400, "Solo se puede cancelar o reprogramar una asesoría programada.")
  }

  if (payload.accion === "cancelar") {
    const cadenaVieja = await resolverCadenaReservada(asesoria.idAgenda, asesoria.duracionMinutos)
    await prisma.$transaction([
      prisma.agenda.updateMany({
        where: { idAgenda: { in: cadenaVieja.map((b) => b.idAgenda) } },
        data: { estado: "disponible" },
      }),
      prisma.asesoria.update({
        where: { idAsesoria },
        data: { estadoAsesoria: "cancelada", observaciones: payload.motivo },
      }),
    ])
  } else {
    // Misma duración de siempre, solo cambia el horario de inicio: se
    // resuelve la nueva cadena ANTES de tocar nada, para no dejar la
    // asesoría sin bloques reservados si el nuevo horario ya no alcanza.
    const nuevaCadena = await resolverCadenaDeBloques(payload.nuevoIdAgenda, asesoria.duracionMinutos)
    const nuevoAncla = nuevaCadena[0]
    const cadenaVieja = await resolverCadenaReservada(asesoria.idAgenda, asesoria.duracionMinutos)

    await prisma.$transaction([
      prisma.agenda.updateMany({
        where: { idAgenda: { in: cadenaVieja.map((b) => b.idAgenda) } },
        data: { estado: "disponible" },
      }),
      prisma.agenda.updateMany({
        where: { idAgenda: { in: nuevaCadena.map((b) => b.idAgenda) } },
        data: { estado: "reservado" },
      }),
      prisma.asesoria.update({
        where: { idAsesoria },
        data: {
          idAgenda: nuevoAncla.idAgenda,
          fechaAsesoria: combinarFechaHora(nuevoAncla.fecha, nuevoAncla.horaInicio),
        },
      }),
    ])
  }

  const actualizada = await prisma.asesoria.findUniqueOrThrow({ where: { idAsesoria }, include: incluirParaListado })
  await notificarCambioAsesoria(actualizada, asesoria.emprendimientoFase.idEmprendimiento, payload.accion)
  return asesoriaAListado(actualizada)
}

/** El portal del emprendedor no tiene matriz de permisos — se exige en cambio que sea su propia asesoría. */
export async function verificarPropiedadEmprendedor(idAsesoria: number, idUsuarioEmprendedor: string) {
  const idEmprendimientoDelEmprendedor = await resolverIdEmprendimientoDeEmprendedor(idUsuarioEmprendedor)
  const asesoria = await prisma.asesoria.findUnique({
    where: { idAsesoria },
    include: { emprendimientoFase: true },
  })
  if (!asesoria) {
    throw new ErrorApi(404, "Asesoría no encontrada.")
  }
  if (asesoria.emprendimientoFase.idEmprendimiento !== idEmprendimientoDelEmprendedor) {
    throw new ErrorApi(403, "No tiene permiso para modificar esta asesoría.")
  }
}

/** Registrar lo ocurrido en una asesoría ya programada, una vez pasada su fecha — exclusivo del asesor. */
export async function registrarResultado(
  idAsesoria: number,
  payload: { realizada: boolean; avance?: string; observaciones?: string },
) {
  const asesoria = await prisma.asesoria.findUnique({ where: { idAsesoria } })
  if (!asesoria) {
    throw new ErrorApi(404, "Asesoría no encontrada.")
  }
  if (asesoria.estadoAsesoria !== "programada") {
    throw new ErrorApi(400, "Solo se puede registrar el resultado de una asesoría programada.")
  }

  if (payload.realizada) {
    await prisma.asesoria.update({
      where: { idAsesoria },
      data: { estadoAsesoria: "completada", avance: payload.avance ?? null },
    })
  } else {
    await prisma.asesoria.update({
      where: { idAsesoria },
      data: { estadoAsesoria: "no_realizada", observaciones: payload.observaciones ?? null },
    })
  }

  const actualizada = await prisma.asesoria.findUniqueOrThrow({ where: { idAsesoria }, include: incluirParaListado })
  return asesoriaAListado(actualizada)
}

/** Eliminar del registro una asesoría ya cancelada (limpieza del listado). */
export async function eliminarAsesoria(idAsesoria: number) {
  const asesoria = await prisma.asesoria.findUnique({ where: { idAsesoria } })
  if (!asesoria) {
    throw new ErrorApi(404, "Asesoría no encontrada.")
  }
  if (asesoria.estadoAsesoria !== "cancelada") {
    throw new ErrorApi(400, "Solo se pueden eliminar asesorías canceladas.")
  }
  await prisma.asesoria.delete({ where: { idAsesoria } })
}
