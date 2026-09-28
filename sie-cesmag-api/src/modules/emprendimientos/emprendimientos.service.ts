import type { Emprendimiento, Jornada, Prisma } from "@prisma/client"
import { prisma } from "../../lib/prisma.js"
import { construirRuta } from "../../lib/ruta.js"
import { emprendedorParaFrontend } from "../../lib/mappers.js"
import { filaAcaracterizacion, guardarCaracterizacion, type CaracterizacionEmprendimiento } from "../../lib/caracterizacion.js"
import { crearCuentaEmprendedor } from "../emprendedores/emprendedores.service.js"
import { ErrorApi } from "../../middleware/errorHandler.js"

const incluirIntegrantes = { integrantes: { include: { emprendedor: true } } } as const

function integrantesAFrontend(integrantes: { idEmprendimiento: number; emprendedor: Parameters<typeof emprendedorParaFrontend>[0] }[]) {
  return integrantes.map((i) => ({
    idUsuario: i.emprendedor.idUsuario ?? "",
    idEmprendimiento: i.idEmprendimiento,
    emprendedor: emprendedorParaFrontend(i.emprendedor),
  }))
}

function fecha(d: Date | null) {
  return d ? d.toISOString().slice(0, 10) : null
}

/** Listado con filtros — trae la fase actual de cada uno para pintar la tabla. */
export async function listarEmprendimientos(filtros: { busqueda?: string; estado?: string }) {
  const emprendimientos = await prisma.emprendimiento.findMany({
    where: {
      ...(filtros.estado && filtros.estado !== "todos" ? { estado: filtros.estado as Prisma.EnumEstadoEmprendimientoFilter } : {}),
      ...(filtros.busqueda ? { nombreReferencia: { contains: filtros.busqueda, mode: "insensitive" as const } } : {}),
    },
    orderBy: { fechaIngreso: "desc" },
  })

  return Promise.all(
    emprendimientos.map(async (e) => {
      const fases = await prisma.emprendimientoFase.findMany({
        where: { idEmprendimiento: e.idEmprendimiento },
        include: { fase: { include: { etapa: true } } },
        orderBy: { fechaInicio: "desc" },
      })
      const enCurso = fases.find((f) => f.estadoFase === "en_curso")
      return {
        idEmprendimiento: e.idEmprendimiento,
        nombreReferencia: e.nombreReferencia,
        etapaNombre: enCurso?.fase.etapa.nombre ?? "—",
        faseNombre: enCurso ? `${enCurso.fase.numero}. ${enCurso.fase.nombre}` : "—",
        estado: e.estado,
        ultimaActividad: (fases[0]?.fechaInicio ?? e.fechaIngreso).toISOString(),
        diagnosticoPendiente: fases.length === 0,
      }
    }),
  )
}

/** Detalle completo + ruta metodológica. */
export async function obtenerDetalle(idEmprendimiento: number) {
  const emprendimiento = await prisma.emprendimiento.findUnique({
    where: { idEmprendimiento },
    include: incluirIntegrantes,
  })
  if (!emprendimiento) {
    throw new ErrorApi(404, "Emprendimiento no encontrado.")
  }

  const [caracterizacionFila, rutaInfo] = await Promise.all([
    prisma.vistaCaracterizacion.findUnique({ where: { idEmprendimiento } }),
    construirRuta(idEmprendimiento),
  ])

  return armarDetalle(emprendimiento, caracterizacionFila, rutaInfo)
}

function armarDetalle(
  e: Emprendimiento & { integrantes: { idEmprendimiento: number; emprendedor: Parameters<typeof emprendedorParaFrontend>[0] }[] },
  caracterizacionFila: Parameters<typeof filaAcaracterizacion>[0],
  rutaInfo: Awaited<ReturnType<typeof construirRuta>>,
) {
  return {
    idEmprendimiento: e.idEmprendimiento,
    nombreReferencia: e.nombreReferencia,
    estado: e.estado,
    motivo: e.motivo,
    fechaIngreso: fecha(e.fechaIngreso)!,
    fechaCulminacion: fecha(e.fechaCulminacion),
    fechaDesistimiento: fecha(e.fechaDesistimiento),
    fechaReingreso: fecha(e.fechaReingreso),
    fechaInactividad: fecha(e.fechaInactividad),
    diagnosticoInicial: e.diagnosticoInicial,
    integrantes: integrantesAFrontend(e.integrantes),
    faseActual: rutaInfo.faseActual,
    caracterizacion: filaAcaracterizacion(caracterizacionFila),
    diagnosticoPendiente: rutaInfo.diagnosticoPendiente,
    ruta: rutaInfo.ruta,
    fasesCompletadas: rutaInfo.fasesCompletadas,
    totalFases: rutaInfo.totalFases,
    ultimaActividad: (rutaInfo.ultimaActividad ?? e.fechaIngreso).toISOString(),
  }
}

/**
 * Resuelve el `idEmprendimiento` del emprendedor autenticado, sin traer todo
 * el detalle. Lo reutilizan `obtenerEmprendimientoDeEmprendedor` y el módulo
 * de asesorías.
 */
export async function resolverIdEmprendimientoDeEmprendedor(idUsuario: string) {
  const emprendedor = await prisma.emprendedor.findUnique({ where: { idUsuario } })
  if (!emprendedor) {
    throw new ErrorApi(404, "No se encontró un emprendimiento asociado a esta cuenta.")
  }
  const integrante = await prisma.emprendedorEmprendimiento.findFirst({ where: { idEmprendedor: emprendedor.idEmprendedor } })
  if (!integrante) {
    throw new ErrorApi(404, "No se encontró un emprendimiento asociado a esta cuenta.")
  }
  return integrante.idEmprendimiento
}

/** Mismo detalle, resuelto a partir del emprendedor autenticado. */
export async function obtenerEmprendimientoDeEmprendedor(idUsuario: string) {
  const idEmprendimiento = await resolverIdEmprendimientoDeEmprendedor(idUsuario)
  return obtenerDetalle(idEmprendimiento)
}

/** Cambio de estado general, con motivo obligatorio si pasa a inactivo/terminado. */
export async function cambiarEstado(
  idEmprendimiento: number,
  payload: { estadoNuevo: "activo" | "inactivo" | "terminado"; motivo?: string | null; fechaCambio: string },
) {
  if ((payload.estadoNuevo === "inactivo" || payload.estadoNuevo === "terminado") && !payload.motivo) {
    throw new ErrorApi(400, "Debe indicar el motivo del cambio de estado.")
  }
  const fechaEvento = new Date(payload.fechaCambio)

  const data: Prisma.EmprendimientoUpdateInput = { estado: payload.estadoNuevo, motivo: payload.motivo ?? null }
  if (payload.estadoNuevo === "inactivo") data.fechaInactividad = fechaEvento
  if (payload.estadoNuevo === "terminado") data.fechaCulminacion = fechaEvento

  await prisma.emprendimiento.update({ where: { idEmprendimiento }, data })
  return obtenerDetalle(idEmprendimiento)
}

/** Solo aplica sobre emprendimientos en estado "inactivo". */
export async function registrarReingreso(idEmprendimiento: number, fechaReingreso: string) {
  const emprendimiento = await prisma.emprendimiento.findUniqueOrThrow({ where: { idEmprendimiento } })
  if (emprendimiento.estado !== "inactivo") {
    throw new ErrorApi(400, "El reingreso solo aplica a emprendimientos inactivos.")
  }
  await prisma.emprendimiento.update({
    where: { idEmprendimiento },
    data: { estado: "activo", motivo: null, fechaReingreso: new Date(fechaReingreso) },
  })
  return obtenerDetalle(idEmprendimiento)
}

/**
 * Registra el diagnóstico y crea de una vez las 12 filas de
 * EMPRENDIMIENTO_FASE (todas "pendiente" salvo la primera fase de la etapa
 * de ingreso, que queda "en_curso") — así la ruta completa ya puede
 * mostrarse desde el primer momento. Solo se puede hacer una vez.
 */
export async function registrarDiagnosticoInicial(idEmprendimiento: number, situacionActual: string, idEtapaIngreso: number) {
  const yaTieneDiagnostico = await prisma.emprendimientoFase.count({ where: { idEmprendimiento } })
  if (yaTieneDiagnostico > 0) {
    throw new ErrorApi(400, "Este emprendimiento ya tiene un diagnóstico registrado.")
  }

  const fases = await prisma.fase.findMany({ orderBy: { numero: "asc" } })
  const primeraFaseDeEtapa = fases.find((f) => f.idEtapa === idEtapaIngreso)
  if (!primeraFaseDeEtapa) {
    throw new ErrorApi(400, "Etapa de ingreso inválida.")
  }

  await prisma.$transaction([
    prisma.emprendimiento.update({ where: { idEmprendimiento }, data: { diagnosticoInicial: situacionActual } }),
    prisma.emprendimientoFase.createMany({
      data: fases.map((fase) => ({
        idEmprendimiento,
        idFase: fase.idFase,
        fechaInicio: new Date(),
        estadoFase: fase.idFase === primeraFaseDeEtapa.idFase ? ("en_curso" as const) : ("pendiente" as const),
      })),
    }),
  ])

  return obtenerDetalle(idEmprendimiento)
}

/**
 * Aprueba el cumplimiento de la fase en curso y avanza a la siguiente.
 * Exige que haya al menos un entregable en la fase y que todos tengan su
 * último intento aprobado. `Fase.numero` es único y correlativo a lo largo
 * de toda la ruta (no solo dentro de la etapa), así que "la siguiente fase"
 * es simplemente `numero + 1`; si no existe, la fase en curso era la última
 * y el emprendimiento queda sin ninguna fase "en_curso".
 */
export async function avanzarFase(idEmprendimiento: number) {
  const faseEnCurso = await prisma.emprendimientoFase.findFirst({
    where: { idEmprendimiento, estadoFase: "en_curso" },
    include: { fase: true, entregables: { include: { intentos: { orderBy: { idIntentoEntrega: "asc" } } } } },
  })
  if (!faseEnCurso) {
    throw new ErrorApi(400, "Este emprendimiento no tiene una fase en curso.")
  }

  const todoAprobado =
    faseEnCurso.entregables.length > 0 &&
    faseEnCurso.entregables.every((e) => e.intentos[e.intentos.length - 1]?.estadoRevision === "aprobado")
  if (!todoAprobado) {
    throw new ErrorApi(400, "Todos los entregables de la fase deben estar aprobados para avanzar.")
  }

  const siguienteFase = await prisma.fase.findUnique({ where: { numero: faseEnCurso.fase.numero + 1 } })

  const operaciones: Prisma.PrismaPromise<unknown>[] = [
    prisma.emprendimientoFase.update({
      where: { idEmprendimientoFase: faseEnCurso.idEmprendimientoFase },
      data: { estadoFase: "completada", fechaFin: new Date() },
    }),
  ]
  if (siguienteFase) {
    operaciones.push(
      prisma.emprendimientoFase.updateMany({
        where: { idEmprendimiento, idFase: siguienteFase.idFase },
        data: { estadoFase: "en_curso", fechaInicio: new Date() },
      }),
    )
  }
  await prisma.$transaction(operaciones)

  return obtenerDetalle(idEmprendimiento)
}

/** Edita directamente las respuestas del formulario fundador — ver `guardarCaracterizacion`. */
export async function editarCaracterizacion(idEmprendimiento: number, datos: CaracterizacionEmprendimiento) {
  const emprendimiento = await prisma.emprendimiento.findUniqueOrThrow({ where: { idEmprendimiento } })
  if (!emprendimiento.idFormulario) {
    throw new ErrorApi(400, "Este emprendimiento no tiene un formulario de caracterización asociado.")
  }
  await guardarCaracterizacion(emprendimiento.idFormulario, datos)
  return obtenerDetalle(idEmprendimiento)
}

/**
 * Crea un emprendimiento directamente desde el panel admin — la misma
 * búsqueda por número de identificación de "agregar integrante" (persona ya
 * con cuenta / precandidato sin aprobar / nadie encontrado, caso en el que
 * hacen falta `nombre`/`correo`) resuelve quién es el fundador, y le crea la
 * cuenta si todavía no la tiene. Nace sin fase; el diagnóstico inicial la
 * asigna después.
 */
export async function crearEmprendimiento(payload: {
  nombreReferencia: string
  numeroIdentificacion: string
  nombre?: string
  correo?: string
  fechaNacimiento?: string
  programaAcademico?: string
  semestre?: number
  jornada?: Jornada
}) {
  let emprendedor = await prisma.emprendedor.findUnique({ where: { numeroIdentificacion: payload.numeroIdentificacion } })

  if (!emprendedor) {
    if (!payload.nombre || !payload.correo) {
      throw new ErrorApi(
        404,
        "No se encontró a nadie con ese número de identificación. Complete nombre y correo para crear la cuenta.",
      )
    }
    emprendedor = await prisma.emprendedor.create({
      data: {
        numeroIdentificacion: payload.numeroIdentificacion,
        nombre: payload.nombre,
        correo: payload.correo,
        estadoPrecandidato: "pendiente",
        fechaNacimiento: payload.fechaNacimiento ? new Date(payload.fechaNacimiento) : undefined,
        programaAcademico: payload.programaAcademico,
        semestre: payload.semestre,
        jornada: payload.jornada,
      },
    })
  }

  if (!emprendedor.idUsuario) {
    emprendedor = await crearCuentaEmprendedor(emprendedor.idEmprendedor)
  }

  // Reutiliza el formulario del fundador si tiene uno libre; si ya está
  // vinculado a otro emprendimiento, este nace sin formulario (la relación
  // es 1 a 1) — la caracterización se completa después.
  let idFormulario: number | null = null
  const formulario = await prisma.formulario.findUnique({ where: { idEmprendedor: emprendedor.idEmprendedor } })
  if (formulario) {
    const yaUsado = await prisma.emprendimiento.findUnique({ where: { idFormulario: formulario.idFormulario } })
    if (!yaUsado) idFormulario = formulario.idFormulario
  } else {
    const nuevoFormulario = await prisma.formulario.create({
      data: { idEmprendedor: emprendedor.idEmprendedor, filtroInicial: "activo", quiereAcompanamiento: true },
    })
    idFormulario = nuevoFormulario.idFormulario
  }

  const emprendimiento = await prisma.emprendimiento.create({
    data: {
      idFormulario,
      nombreReferencia: payload.nombreReferencia,
      estado: "activo",
      fechaIngreso: new Date(),
    },
  })

  await prisma.emprendedorEmprendimiento.create({
    data: { idEmprendedor: emprendedor.idEmprendedor, idEmprendimiento: emprendimiento.idEmprendimiento },
  })

  return { idEmprendimiento: emprendimiento.idEmprendimiento }
}
