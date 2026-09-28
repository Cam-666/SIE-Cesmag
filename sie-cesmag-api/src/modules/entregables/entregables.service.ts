import type { EstadoActividad, EstadoRevision, Prisma } from "@prisma/client"
import { prisma } from "../../lib/prisma.js"
import { supabaseAdmin } from "../../lib/supabase.js"
import { resolverIdEmprendimientoDeEmprendedor } from "../emprendimientos/emprendimientos.service.js"
import { crearNotificaciones } from "../notificaciones/notificaciones.service.js"
import { ErrorApi } from "../../middleware/errorHandler.js"

/** Bucket privado de Supabase Storage — cada emprendedor sube a su propia carpeta (`<idUsuario>/...`), reforzado por RLS. */
const BUCKET_EVIDENCIAS = "evidencias-entregables"

const incluirCompleto = {
  emprendimientoFase: { include: { emprendimiento: true, fase: true } },
  intentos: { orderBy: { idIntentoEntrega: "asc" } },
} satisfies Prisma.EntregableInclude

type EntregableRow = Prisma.EntregableGetPayload<{ include: typeof incluirCompleto }>

function fecha(d: Date) {
  return d.toISOString().slice(0, 10)
}

function intentoAFrontend(i: EntregableRow["intentos"][number]) {
  return {
    idIntentoEntrega: i.idIntentoEntrega,
    idEntregable: i.idEntregable,
    rutaEvidencia: i.rutaEvidencia,
    nombreArchivo: i.nombreArchivo,
    fechaEntrega: i.fechaEntrega ? i.fechaEntrega.toISOString() : null,
    estadoRevision: i.estadoRevision,
    observaciones: i.observaciones,
  }
}

function ultimoIntento(e: EntregableRow) {
  return e.intentos[e.intentos.length - 1] ?? null
}

/** Proyección compartida por el listado general y el drill-down por fase. */
function entregableAListado(e: EntregableRow) {
  return {
    idEntregable: e.idEntregable,
    titulo: e.titulo,
    emprendimiento: e.emprendimientoFase.emprendimiento.nombreReferencia,
    faseNombre: `${e.emprendimientoFase.fase.numero}. ${e.emprendimientoFase.fase.nombre}`,
    estadoActividad: e.estadoActividad,
    estadoRevision: ultimoIntento(e)?.estadoRevision ?? null,
  }
}

/** Detalle completo con historial de intentos, compartido entre admin y emprendedor. */
function entregableADetalle(e: EntregableRow) {
  const ultimo = ultimoIntento(e)
  return {
    idEntregable: e.idEntregable,
    idEmprendimientoFase: e.idEmprendimientoFase,
    titulo: e.titulo,
    descripcion: e.descripcion,
    fechaPrevista: fecha(e.fechaPrevista),
    estadoActividad: e.estadoActividad,
    ultimoIntento: ultimo ? intentoAFrontend(ultimo) : undefined,
    emprendimiento: e.emprendimientoFase.emprendimiento.nombreReferencia,
    faseNombre: `${e.emprendimientoFase.fase.numero}. ${e.emprendimientoFase.fase.nombre}`,
    intentos: e.intentos.map(intentoAFrontend),
  }
}

/**
 * Estado combinado tal como lo ve el emprendedor: "rechazado" se refleja
 * como "pendiente" porque implica que debe volver a intentar la entrega.
 */
function estadoEmprendedorDe(estadoActividad: EstadoActividad, estadoRevisionUltimo: EstadoRevision | null) {
  if (estadoRevisionUltimo === "aprobado") return "aprobado"
  if (estadoRevisionUltimo === "pendiente") return "en_revision"
  if (estadoActividad === "no_entregado") return "no_entregado"
  return "pendiente"
}

/** Listado general de entregables. */
export async function listarEntregables(filtros: { estado?: string }) {
  const entregables = await prisma.entregable.findMany({
    include: incluirCompleto,
    orderBy: { fechaPrevista: "desc" },
  })
  const listado = entregables.map(entregableAListado)
  if (filtros.estado && filtros.estado !== "todos") {
    return listado.filter((e) => e.estadoRevision === filtros.estado)
  }
  return listado
}

/** Entregables de una fase específica de un emprendimiento (drill-down `FaseEntregablesDialog`). */
export async function listarEntregablesPorFase(idEmprendimiento: number, idFase: number) {
  const entregables = await prisma.entregable.findMany({
    where: { emprendimientoFase: { idEmprendimiento, idFase } },
    include: incluirCompleto,
    orderBy: { fechaPrevista: "asc" },
  })
  return entregables.map(entregableAListado)
}

/** Detalle de un entregable — compartido entre `EntregableRevisionDialog` (admin) y `CargarEvidenciaDialog` (emprendedor). */
export async function obtenerEntregable(idEntregable: number) {
  const entregable = await prisma.entregable.findUnique({ where: { idEntregable }, include: incluirCompleto })
  if (!entregable) {
    throw new ErrorApi(404, "Entregable no encontrado.")
  }
  return entregableADetalle(entregable)
}

/**
 * El bucket es privado — `rutaEvidencia` no sirve como URL directa. Se firma
 * bajo demanda con el service role (así el backend sigue controlando el
 * mismo permiso que protege el resto del detalle). Vence a los 5 minutos: se
 * genera de nuevo cada vez que alguien hace clic en "Ver archivo".
 */
export async function obtenerUrlEvidencia(idEntregable: number) {
  const entregable = await prisma.entregable.findUnique({
    where: { idEntregable },
    include: { intentos: { orderBy: { idIntentoEntrega: "asc" } } },
  })
  if (!entregable) {
    throw new ErrorApi(404, "Entregable no encontrado.")
  }
  const ultimo = entregable.intentos[entregable.intentos.length - 1] ?? null
  if (!ultimo) {
    throw new ErrorApi(404, "Este entregable todavía no tiene evidencia cargada.")
  }

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_EVIDENCIAS)
    .createSignedUrl(ultimo.rutaEvidencia, 300)
  if (error || !data) {
    throw new ErrorApi(500, "No se pudo generar el enlace del archivo.")
  }
  return { url: data.signedUrl }
}

/**
 * Registra un entregable asignado a un emprendimiento y fase. Resuelve
 * `idFase` (catálogo) a la fila EMPRENDIMIENTO_FASE real; si no existe es
 * porque el emprendimiento todavía no tiene diagnóstico inicial registrado.
 */
export async function crearEntregable(payload: {
  idEmprendimiento: number
  idFase: number
  titulo: string
  descripcion: string
  fechaPrevista: string
}) {
  const emprendimientoFase = await prisma.emprendimientoFase.findUnique({
    where: { idEmprendimiento_idFase: { idEmprendimiento: payload.idEmprendimiento, idFase: payload.idFase } },
  })
  if (!emprendimientoFase) {
    throw new ErrorApi(
      400,
      "Este emprendimiento todavía no tiene esa fase en su ruta. Registre el diagnóstico inicial antes de asignar entregables.",
    )
  }

  const creado = await prisma.entregable.create({
    data: {
      idEmprendimientoFase: emprendimientoFase.idEmprendimientoFase,
      titulo: payload.titulo,
      descripcion: payload.descripcion,
      fechaPrevista: new Date(payload.fechaPrevista),
      estadoActividad: "pendiente",
    },
    include: incluirCompleto,
  })
  return entregableAListado(creado)
}

/** El portal del emprendedor no tiene matriz de permisos — se exige en cambio que sea su propio entregable. */
export async function verificarPropiedadEmprendedor(idEntregable: number, idUsuarioEmprendedor: string) {
  const idEmprendimientoDelEmprendedor = await resolverIdEmprendimientoDeEmprendedor(idUsuarioEmprendedor)
  const entregable = await prisma.entregable.findUnique({
    where: { idEntregable },
    include: { emprendimientoFase: true },
  })
  if (!entregable) {
    throw new ErrorApi(404, "Entregable no encontrado.")
  }
  if (entregable.emprendimientoFase.idEmprendimiento !== idEmprendimientoDelEmprendedor) {
    throw new ErrorApi(403, "No tiene permiso para acceder a este entregable.")
  }
}

/** Entregables asignados al emprendimiento del emprendedor autenticado. */
export async function listarMisEntregables(idUsuarioEmprendedor: string) {
  const idEmprendimiento = await resolverIdEmprendimientoDeEmprendedor(idUsuarioEmprendedor)
  const entregables = await prisma.entregable.findMany({
    where: { emprendimientoFase: { idEmprendimiento } },
    include: incluirCompleto,
    orderBy: { fechaPrevista: "asc" },
  })
  return entregables.map((e) => {
    const ultimo = ultimoIntento(e)
    return {
      idEntregable: e.idEntregable,
      titulo: e.titulo,
      descripcion: e.descripcion,
      faseNombre: `${e.emprendimientoFase.fase.numero}. ${e.emprendimientoFase.fase.nombre}`,
      fechaPrevista: fecha(e.fechaPrevista),
      estadoActividad: e.estadoActividad,
      estado: estadoEmprendedorDe(e.estadoActividad, ultimo?.estadoRevision ?? null),
    }
  })
}

/**
 * Registra un nuevo intento de entrega con la evidencia ya subida. Bloquea
 * una nueva carga mientras el último intento siga aprobado (nada que volver
 * a entregar) o pendiente de revisión.
 */
export async function cargarEvidencia(
  idUsuarioEmprendedor: string,
  idEntregable: number,
  payload: { rutaEvidencia: string; nombreArchivo: string; comentario?: string },
) {
  await verificarPropiedadEmprendedor(idEntregable, idUsuarioEmprendedor)

  const entregable = await prisma.entregable.findUnique({
    where: { idEntregable },
    include: { intentos: { orderBy: { idIntentoEntrega: "asc" } } },
  })
  if (!entregable) {
    throw new ErrorApi(404, "Entregable no encontrado.")
  }
  const ultimo = entregable.intentos[entregable.intentos.length - 1] ?? null
  if (ultimo?.estadoRevision === "aprobado") {
    throw new ErrorApi(400, "Este entregable ya fue aprobado. No es necesario volver a entregarlo.")
  }
  if (ultimo?.estadoRevision === "pendiente") {
    throw new ErrorApi(400, "Ya hay una entrega pendiente de revisión para este entregable.")
  }

  await prisma.$transaction([
    prisma.intentoEntrega.create({
      data: {
        idEntregable,
        rutaEvidencia: payload.rutaEvidencia,
        nombreArchivo: payload.nombreArchivo,
        fechaEntrega: new Date(),
        estadoRevision: "pendiente",
        observaciones: payload.comentario?.trim() || null,
      },
    }),
    prisma.entregable.update({ where: { idEntregable }, data: { estadoActividad: "entregado" } }),
  ])

  return obtenerEntregable(idEntregable)
}

/**
 * Registra la decisión del coordinador sobre el último intento (pendiente de
 * revisión) de un entregable. Un intento ya aprobado/rechazado no puede
 * volver a revisarse — el emprendedor debe cargar uno nuevo. Un rechazo
 * devuelve el compromiso a "pendiente" (debe reintentarse); una aprobación lo
 * deja "entregado". Notifica al/los emprendedor(es) del resultado.
 */
export async function revisarEntregable(
  idEntregable: number,
  payload: { decision: "aprobado" | "rechazado"; observaciones?: string },
) {
  const entregable = await prisma.entregable.findUnique({
    where: { idEntregable },
    include: { intentos: { orderBy: { idIntentoEntrega: "asc" } }, emprendimientoFase: true },
  })
  if (!entregable) {
    throw new ErrorApi(404, "Entregable no encontrado.")
  }
  const ultimo = entregable.intentos[entregable.intentos.length - 1] ?? null
  if (!ultimo) {
    throw new ErrorApi(400, "El emprendedor aún no ha cargado evidencia para este entregable.")
  }
  if (ultimo.estadoRevision !== "pendiente") {
    throw new ErrorApi(400, "Este intento ya fue revisado.")
  }

  await prisma.$transaction([
    prisma.intentoEntrega.update({
      where: { idIntentoEntrega: ultimo.idIntentoEntrega },
      data: {
        estadoRevision: payload.decision,
        observaciones: payload.observaciones?.trim() || null,
      },
    }),
    prisma.entregable.update({
      where: { idEntregable },
      data: { estadoActividad: payload.decision === "aprobado" ? "entregado" : "pendiente" },
    }),
  ])

  await notificarResultadoRevision(entregable.emprendimientoFase.idEmprendimiento, idEntregable, entregable.titulo, payload.decision)

  return obtenerEntregable(idEntregable)
}

/**
 * Avisa a todo integrante del emprendimiento que ya tenga cuenta. Algunos
 * integrantes registrados como EMPRENDEDOR pueden no tener `idUsuario`
 * (precandidatos sin aprobar) — a esos no se les puede notificar.
 */
async function notificarResultadoRevision(
  idEmprendimiento: number,
  idEntregable: number,
  titulo: string,
  decision: "aprobado" | "rechazado",
) {
  const integrantes = await prisma.emprendedorEmprendimiento.findMany({
    where: { idEmprendimiento },
    include: { emprendedor: true },
  })
  const destinatarios = integrantes.map((i) => i.emprendedor.idUsuario).filter((id): id is string => id !== null)
  if (destinatarios.length === 0) return

  const mensaje =
    decision === "aprobado"
      ? `Su entrega para "${titulo}" fue aprobada.`
      : `Su entrega para "${titulo}" fue rechazada. Revise las observaciones y vuelva a intentarlo.`

  await crearNotificaciones(
    destinatarios.map((idUsuario) => ({ idUsuario, tipo: "resultado_revision" as const, mensaje, idEntregable })),
  )
}
