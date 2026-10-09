import type { EstadoActividad, EstadoRevision, Prisma } from "@prisma/client"
import { prisma } from "../../lib/prisma.js"
import { resolverCarpetaEntregable, subirArchivoADrive, eliminarArchivoDeDrive } from "../../lib/googleDrive.js"
import { resolverIdEmprendimientoDeEmprendedor } from "../emprendimientos/emprendimientos.service.js"
import { crearNotificaciones } from "../notificaciones/notificaciones.service.js"
import { ErrorApi } from "../../middleware/errorHandler.js"

const incluirCompleto = {
  emprendimientoFase: { include: { emprendimiento: true, fase: { include: { etapa: true } } } },
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

/**
 * Listado general de entregables. `idsEtapaResponsable` no vacío restringe a
 * los de esas etapas — ver "Responsables por etapa" en Usuarios y Roles.
 */
export async function listarEntregables(filtros: { estado?: string }, idsEtapaResponsable?: number[]) {
  const entregables = await prisma.entregable.findMany({
    where:
      idsEtapaResponsable && idsEtapaResponsable.length > 0
        ? { emprendimientoFase: { fase: { idEtapa: { in: idsEtapaResponsable } } } }
        : undefined,
    include: incluirCompleto,
    orderBy: { fechaPrevista: "desc" },
  })
  const listado = entregables.map(entregableAListado)
  if (filtros.estado && filtros.estado !== "todos") {
    return listado.filter((e) => e.estadoRevision === filtros.estado)
  }
  return listado
}

/**
 * Entregables de las etapas donde el usuario administrativo autenticado es
 * el responsable asignado — para "Mi calendario" (Mi perfil), igual que
 * `listarMisAsesoriasComoAsesor`: solo lo que le compete a esta persona, no
 * el listado general de todo el equipo. Si no es responsable de ninguna
 * etapa, no ve nada aquí (no hay un "para todos" como con las asesorías,
 * donde cada una sí tiene un asesor fijo).
 */
export async function listarEntregablesComoResponsable(idUsuario: string) {
  const entregables = await prisma.entregable.findMany({
    where: { emprendimientoFase: { fase: { etapa: { idUsuarioResponsable: idUsuario } } } },
    include: incluirCompleto,
    orderBy: { fechaPrevista: "asc" },
  })
  return entregables.map((e) => ({ ...entregableAListado(e), fechaPrevista: fecha(e.fechaPrevista) }))
}

/** Entregables de una fase específica de un emprendimiento (drill-down `FaseEntregablesDialog`). */
export async function listarEntregablesPorFase(idEmprendimiento: number, idFase: number, idsEtapaResponsable?: number[]) {
  if (idsEtapaResponsable && idsEtapaResponsable.length > 0) {
    const fase = await prisma.fase.findUnique({ where: { idFase }, select: { idEtapa: true } })
    if (!fase || !idsEtapaResponsable.includes(fase.idEtapa)) {
      throw new ErrorApi(403, "No tiene acceso a esta fase.")
    }
  }
  const entregables = await prisma.entregable.findMany({
    where: { emprendimientoFase: { idEmprendimiento, idFase } },
    include: incluirCompleto,
    orderBy: { fechaPrevista: "asc" },
  })
  return entregables.map(entregableAListado)
}

/** Detalle de un entregable — compartido entre `EntregableRevisionDialog` (admin) y `CargarEvidenciaDialog` (emprendedor). */
export async function obtenerEntregable(idEntregable: number, idsEtapaResponsable?: number[]) {
  const entregable = await prisma.entregable.findUnique({ where: { idEntregable }, include: incluirCompleto })
  if (!entregable) {
    throw new ErrorApi(404, "Entregable no encontrado.")
  }
  if (idsEtapaResponsable && idsEtapaResponsable.length > 0 && !idsEtapaResponsable.includes(entregable.emprendimientoFase.fase.idEtapa)) {
    throw new ErrorApi(403, "No tiene acceso a este entregable.")
  }
  return entregableADetalle(entregable)
}

/**
 * `rutaEvidencia` guarda el ID del archivo en Google Drive (no una URL
 * completa), igual que antes guardaba la ruta dentro del bucket de Supabase
 * — el enlace de visualización se arma a partir de ese ID. El archivo ya
 * quedó compartido como "cualquiera con el enlace" al subirlo
 * (`subirArchivoADrive`), así que a diferencia de Supabase no hace falta
 * firmar nada ni hay vencimiento.
 */
export async function obtenerUrlEvidencia(idEntregable: number, idsEtapaResponsable?: number[]) {
  const entregable = await prisma.entregable.findUnique({
    where: { idEntregable },
    include: { intentos: { orderBy: { idIntentoEntrega: "asc" } }, emprendimientoFase: { include: { fase: true } } },
  })
  if (!entregable) {
    throw new ErrorApi(404, "Entregable no encontrado.")
  }
  if (idsEtapaResponsable && idsEtapaResponsable.length > 0 && !idsEtapaResponsable.includes(entregable.emprendimientoFase.fase.idEtapa)) {
    throw new ErrorApi(403, "No tiene acceso a este entregable.")
  }
  const ultimo = entregable.intentos[entregable.intentos.length - 1] ?? null
  if (!ultimo) {
    throw new ErrorApi(404, "Este entregable todavía no tiene evidencia cargada.")
  }
  return { url: `https://drive.google.com/file/d/${ultimo.rutaEvidencia}/view` }
}

/**
 * Registra un entregable asignado a un emprendimiento y fase. Resuelve
 * `idFase` (catálogo) a la fila EMPRENDIMIENTO_FASE real; si no existe es
 * porque el emprendimiento todavía no tiene diagnóstico inicial registrado.
 */
export async function crearEntregable(
  payload: {
    idEmprendimiento: number
    idFase: number
    titulo: string
    descripcion: string
    fechaPrevista: string
  },
  idsEtapaResponsable?: number[],
) {
  const emprendimientoFase = await prisma.emprendimientoFase.findUnique({
    where: { idEmprendimiento_idFase: { idEmprendimiento: payload.idEmprendimiento, idFase: payload.idFase } },
    include: { fase: { include: { etapa: true } } },
  })
  if (!emprendimientoFase) {
    throw new ErrorApi(
      400,
      "Este emprendimiento todavía no tiene esa fase en su ruta. Registre el diagnóstico inicial antes de asignar entregables.",
    )
  }
  if (idsEtapaResponsable && idsEtapaResponsable.length > 0 && !idsEtapaResponsable.includes(emprendimientoFase.fase.idEtapa)) {
    throw new ErrorApi(403, "No tiene acceso a esta fase.")
  }
  if (emprendimientoFase.estadoFase === "completada") {
    throw new ErrorApi(400, "Esta fase ya está completada — no se le pueden asignar más entregables.")
  }

  // Todas las fases existen desde el diagnóstico inicial, aunque el
  // emprendimiento haya entrado en una etapa avanzada (las anteriores
  // quedan "pendiente" para que la ruta se vea completa) — sin este chequeo
  // se podría asignar un entregable a una etapa que nunca va a cursar.
  const emprendimiento = await prisma.emprendimiento.findUniqueOrThrow({
    where: { idEmprendimiento: payload.idEmprendimiento },
  })
  if (emprendimiento.idEtapaIngreso) {
    const etapaIngreso = await prisma.etapa.findUnique({ where: { idEtapa: emprendimiento.idEtapaIngreso } })
    if (etapaIngreso && emprendimientoFase.fase.etapa.numero < etapaIngreso.numero) {
      throw new ErrorApi(400, "Esta etapa es anterior a la etapa de ingreso del emprendimiento.")
    }
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
 * Registra un nuevo intento de entrega subiendo la evidencia a Google Drive
 * (carpeta Entregables SIE CESMAG / <emprendimiento> / <etapa> / <fase>, a
 * pedido del profesor evaluador — reemplaza el bucket de Supabase Storage
 * que se usaba antes). Bloquea una nueva carga mientras el último intento
 * siga aprobado (nada que volver a entregar) o pendiente de revisión.
 */
export async function cargarEvidencia(
  idUsuarioEmprendedor: string,
  idEntregable: number,
  payload: { archivoBuffer: Buffer; nombreArchivo: string; mimeType: string; comentario?: string },
) {
  await verificarPropiedadEmprendedor(idEntregable, idUsuarioEmprendedor)

  const entregable = await prisma.entregable.findUnique({
    where: { idEntregable },
    include: incluirCompleto,
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

  const idCarpeta = await resolverCarpetaEntregable(
    entregable.emprendimientoFase.emprendimiento.nombreReferencia,
    entregable.emprendimientoFase.fase.etapa.nombre,
    entregable.emprendimientoFase.fase.nombre,
  )
  const { idArchivo } = await subirArchivoADrive(payload.archivoBuffer, payload.nombreArchivo, payload.mimeType, idCarpeta)

  const esReintento = ultimo?.estadoRevision === "rechazado"

  await prisma.$transaction([
    prisma.intentoEntrega.create({
      data: {
        idEntregable,
        rutaEvidencia: idArchivo,
        nombreArchivo: payload.nombreArchivo,
        fechaEntrega: new Date(),
        estadoRevision: "pendiente",
        observaciones: payload.comentario?.trim() || null,
      },
    }),
    prisma.entregable.update({ where: { idEntregable }, data: { estadoActividad: "entregado" } }),
  ])

  await notificarNuevaEntrega(entregable, esReintento)

  return obtenerEntregable(idEntregable)
}

/**
 * Avisa a quien debe revisar: el responsable de la etapa si hay uno
 * asignado (ver "Responsables por etapa" en Usuarios y Roles); si no hay
 * ninguno, a todo el personal administrativo con permiso de editar
 * Entregables, para que una entrega nunca quede sin que nadie se entere.
 */
async function notificarNuevaEntrega(entregable: EntregableRow, esReintento: boolean) {
  const idResponsable = entregable.emprendimientoFase.fase.etapa.idUsuarioResponsable

  const destinatarios = idResponsable
    ? [idResponsable]
    : (
        await prisma.usuario.findMany({
          where: { activo: true, rol: { permisos: { some: { modulo: "entregables", puedeEditar: true } } } },
          select: { idUsuario: true },
        })
      ).map((u) => u.idUsuario)

  if (destinatarios.length === 0) return

  const mensaje = esReintento
    ? `${entregable.emprendimientoFase.emprendimiento.nombreReferencia} volvió a entregar "${entregable.titulo}" tras el rechazo.`
    : `${entregable.emprendimientoFase.emprendimiento.nombreReferencia} entregó "${entregable.titulo}" y está pendiente de revisión.`

  await crearNotificaciones(
    destinatarios.map((idUsuario) => ({
      idUsuario,
      tipo: "entrega_recibida" as const,
      mensaje,
      idEntregable: entregable.idEntregable,
    })),
  )
}

/**
 * Retracta el último intento mientras sigue pendiente de revisión — permite
 * al emprendedor corregir un archivo mal cargado sin esperar a que el
 * coordinador lo rechace. Borra también el archivo de Drive; si esa parte
 * falla igual se borra la fila (no bloquea al emprendedor por un problema de
 * limpieza que no puede resolver desde la UI).
 */
export async function eliminarIntentoPendiente(idUsuarioEmprendedor: string, idEntregable: number) {
  await verificarPropiedadEmprendedor(idEntregable, idUsuarioEmprendedor)

  const entregable = await prisma.entregable.findUnique({
    where: { idEntregable },
    include: { intentos: { orderBy: { idIntentoEntrega: "asc" } } },
  })
  if (!entregable) {
    throw new ErrorApi(404, "Entregable no encontrado.")
  }
  const ultimo = entregable.intentos[entregable.intentos.length - 1] ?? null
  if (!ultimo || ultimo.estadoRevision !== "pendiente") {
    throw new ErrorApi(400, "No hay una entrega pendiente de revisión para borrar.")
  }

  try {
    await eliminarArchivoDeDrive(ultimo.rutaEvidencia)
  } catch (err) {
    console.error("[eliminarIntentoPendiente] no se pudo borrar el archivo de Drive:", ultimo.rutaEvidencia, err)
  }

  const estadoActividad: EstadoActividad = entregable.fechaPrevista < new Date() ? "no_entregado" : "pendiente"
  await prisma.$transaction([
    prisma.intentoEntrega.delete({ where: { idIntentoEntrega: ultimo.idIntentoEntrega } }),
    prisma.entregable.update({ where: { idEntregable }, data: { estadoActividad } }),
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
