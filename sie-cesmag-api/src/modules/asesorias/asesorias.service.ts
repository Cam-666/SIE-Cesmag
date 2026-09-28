import { Prisma, type EstadoAsesoria } from "@prisma/client"
import { prisma } from "../../lib/prisma.js"
import { combinarFechaHora } from "../../lib/horario.js"
import { resolverIdEmprendimientoDeEmprendedor } from "../emprendimientos/emprendimientos.service.js"
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
    tipoAsesoria: "diagnostica" | "seguimiento"
    modalidad: "presencial" | "virtual"
    etapaIdentificada?: number | null
  },
) {
  const bloque = await prisma.agenda.findUnique({ where: { idAgenda: payload.idAgenda } })
  if (!bloque) {
    throw new ErrorApi(404, "El horario seleccionado no existe.")
  }
  if (bloque.idUsuario !== idUsuarioActor) {
    throw new ErrorApi(403, "Solo puede agendar dentro de su propia disponibilidad.")
  }
  if (bloque.estado !== "disponible") {
    throw new ErrorApi(409, "El horario seleccionado ya no está disponible.")
  }

  const emprendimiento = await prisma.emprendimiento.findUnique({ where: { idEmprendimiento: payload.idEmprendimiento } })
  if (!emprendimiento) {
    throw new ErrorApi(404, "Emprendimiento no encontrado.")
  }

  const faseObjetivo = await resolverFaseObjetivo(payload.idEmprendimiento, payload.etapaIdentificada)

  const [creada] = await prisma.$transaction([
    prisma.asesoria.create({
      data: {
        idEmprendimientoFase: faseObjetivo.idEmprendimientoFase,
        idAgenda: bloque.idAgenda,
        tipoAsesoria: payload.tipoAsesoria,
        titulo: generarTitulo(payload.tipoAsesoria, faseObjetivo.fase.nombre),
        fechaAsesoria: combinarFechaHora(bloque.fecha, bloque.horaInicio),
        modalidad: payload.modalidad,
        estadoAsesoria: "programada",
      },
      include: incluirParaListado,
    }),
    prisma.agenda.update({ where: { idAgenda: bloque.idAgenda }, data: { estado: "reservado" } }),
  ])

  return asesoriaAListado(creada)
}

/**
 * El emprendedor agenda dentro de un bloque disponible de cualquier miembro
 * del equipo administrativo; queda confirmada de inmediato. El formulario no
 * pide modalidad, así que se asume "virtual". Tampoco hay un campo de
 * título/nota aparte de `motivo`, que se guarda en `observaciones`.
 */
export async function agendarAsesoria(
  idUsuarioEmprendedor: string,
  payload: { idAgenda: number; tipoAsesoria: "diagnostica" | "seguimiento"; motivo: string },
) {
  const idEmprendimiento = await resolverIdEmprendimientoDeEmprendedor(idUsuarioEmprendedor)

  const bloque = await prisma.agenda.findUnique({ where: { idAgenda: payload.idAgenda } })
  if (!bloque) {
    throw new ErrorApi(404, "El horario seleccionado no existe.")
  }
  if (bloque.estado !== "disponible") {
    throw new ErrorApi(409, "El horario seleccionado ya no está disponible.")
  }

  const faseObjetivo = await resolverFaseObjetivo(idEmprendimiento)

  const [creada] = await prisma.$transaction([
    prisma.asesoria.create({
      data: {
        idEmprendimientoFase: faseObjetivo.idEmprendimientoFase,
        idAgenda: bloque.idAgenda,
        tipoAsesoria: payload.tipoAsesoria,
        titulo: generarTitulo(payload.tipoAsesoria, faseObjetivo.fase.nombre),
        fechaAsesoria: combinarFechaHora(bloque.fecha, bloque.horaInicio),
        modalidad: "virtual",
        observaciones: payload.motivo,
        estadoAsesoria: "programada",
      },
      include: incluirParaListado,
    }),
    prisma.agenda.update({ where: { idAgenda: bloque.idAgenda }, data: { estado: "reservado" } }),
  ])

  return asesoriaAListado(creada)
}

/** Cancela (libera el bloque) o reprograma (lo cambia por otro disponible). */
export async function cancelarOReprogramar(
  idAsesoria: number,
  payload: { accion: "cancelar"; motivo: string } | { accion: "reprogramar"; nuevoIdAgenda: number },
) {
  const asesoria = await prisma.asesoria.findUnique({ where: { idAsesoria } })
  if (!asesoria) {
    throw new ErrorApi(404, "Asesoría no encontrada.")
  }
  if (asesoria.estadoAsesoria !== "programada") {
    throw new ErrorApi(400, "Solo se puede cancelar o reprogramar una asesoría programada.")
  }

  if (payload.accion === "cancelar") {
    await prisma.$transaction([
      prisma.asesoria.update({
        where: { idAsesoria },
        data: { estadoAsesoria: "cancelada", observaciones: payload.motivo },
      }),
      prisma.agenda.update({ where: { idAgenda: asesoria.idAgenda }, data: { estado: "disponible" } }),
    ])
  } else {
    const nuevoBloque = await prisma.agenda.findUnique({ where: { idAgenda: payload.nuevoIdAgenda } })
    if (!nuevoBloque || nuevoBloque.estado !== "disponible") {
      throw new ErrorApi(409, "El horario seleccionado ya no está disponible.")
    }
    await prisma.$transaction([
      prisma.agenda.update({ where: { idAgenda: asesoria.idAgenda }, data: { estado: "disponible" } }),
      prisma.agenda.update({ where: { idAgenda: nuevoBloque.idAgenda }, data: { estado: "reservado" } }),
      prisma.asesoria.update({
        where: { idAsesoria },
        data: {
          idAgenda: nuevoBloque.idAgenda,
          fechaAsesoria: combinarFechaHora(nuevoBloque.fecha, nuevoBloque.horaInicio),
        },
      }),
    ])
  }

  const actualizada = await prisma.asesoria.findUniqueOrThrow({ where: { idAsesoria }, include: incluirParaListado })
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
