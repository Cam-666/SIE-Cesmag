import { Jornada } from "@prisma/client"
import { prisma } from "../../lib/prisma.js"
import { filaAcaracterizacion } from "../../lib/caracterizacion.js"
import { crearCuentaEmprendedor } from "../emprendedores/emprendedores.service.js"
import { ErrorApi } from "../../middleware/errorHandler.js"

type RespuestaEntrada = { codigo: string; texto?: string; numero?: number; esOtro?: boolean }

/** Bloque 2 del formulario ("Perfil del estudiante") — se guardan como columnas de EMPRENDEDOR, no como RESPUESTA. */
const CODIGOS_PERSONALES = ["programa_academico", "semestre", "jornada", "fecha_nacimiento"]

function esJornadaValida(valor: string | undefined): valor is Jornada {
  return valor === Jornada.Diurna || valor === Jornada.Nocturna || valor === Jornada.Otro
}

/**
 * Procesa un envío de la encuesta pública de caracterización. Si
 * `quiereAcompanamiento`, se incorpora (o actualiza, si ya existía por
 * número de identificación) como precandidato pendiente; si no, se descarta
 * silenciosamente.
 */
export async function recibirFormulario(payload: {
  numeroIdentificacion: string
  nombre: string
  correo: string
  filtroInicial: "activo" | "idea" | "futuro" | "no_interesa"
  quiereAcompanamiento: boolean
  respuestas: RespuestaEntrada[]
}) {
  if (!payload.quiereAcompanamiento) {
    return { incorporado: false as const }
  }

  const porCodigo = new Map(payload.respuestas.map((r) => [r.codigo, r]))
  const jornadaTexto = porCodigo.get("jornada")?.texto
  const semestreRespuesta = porCodigo.get("semestre")
  const semestreValor =
    semestreRespuesta?.numero ?? (semestreRespuesta?.texto ? Number(semestreRespuesta.texto) : undefined)
  const fechaNacimientoTexto = porCodigo.get("fecha_nacimiento")?.texto

  const datosPersonales = {
    programaAcademico: porCodigo.get("programa_academico")?.texto,
    semestre: semestreValor !== undefined && !Number.isNaN(semestreValor) ? semestreValor : undefined,
    jornada: esJornadaValida(jornadaTexto) ? jornadaTexto : undefined,
    fechaNacimiento: fechaNacimientoTexto ? new Date(fechaNacimientoTexto) : undefined,
  }

  const existente = await prisma.emprendedor.findUnique({
    where: { numeroIdentificacion: payload.numeroIdentificacion },
  })
  // Si ya está aprobado (cuenta activa), una nueva respuesta del formulario
  // no debe regresarlo a "pendiente" — solo se actualizan sus datos.
  const estadoPrecandidato = existente?.estadoPrecandidato === "aprobado" ? "aprobado" : "pendiente"

  const emprendedor = await prisma.emprendedor.upsert({
    where: { numeroIdentificacion: payload.numeroIdentificacion },
    update: { nombre: payload.nombre, correo: payload.correo, estadoPrecandidato, ...datosPersonales },
    create: {
      numeroIdentificacion: payload.numeroIdentificacion,
      nombre: payload.nombre,
      correo: payload.correo,
      estadoPrecandidato: "pendiente",
      ...datosPersonales,
    },
  })

  const formulario = await prisma.formulario.upsert({
    where: { idEmprendedor: emprendedor.idEmprendedor },
    update: { filtroInicial: payload.filtroInicial, quiereAcompanamiento: true, fechaRespuesta: new Date() },
    create: {
      idEmprendedor: emprendedor.idEmprendedor,
      filtroInicial: payload.filtroInicial,
      quiereAcompanamiento: true,
    },
  })

  const contenido = payload.respuestas.filter((r) => !CODIGOS_PERSONALES.includes(r.codigo))
  const preguntas = await prisma.pregunta.findMany({
    where: { codigo: { in: [...new Set(contenido.map((r) => r.codigo))] } },
  })
  const idPorCodigo = new Map(preguntas.map((p) => [p.codigo, p.idPregunta]))

  await prisma.$transaction([
    prisma.respuesta.deleteMany({
      where: { idFormulario: formulario.idFormulario, idPregunta: { in: [...idPorCodigo.values()] } },
    }),
    prisma.respuesta.createMany({
      data: contenido
        .filter((r) => idPorCodigo.has(r.codigo))
        .map((r) => ({
          idFormulario: formulario.idFormulario,
          idPregunta: idPorCodigo.get(r.codigo)!,
          textoLibre: r.texto ?? null,
          valorNumero: r.numero ?? null,
          esOtro: r.esOtro ?? null,
        })),
    }),
  ])

  return { incorporado: true as const, idFormulario: formulario.idFormulario }
}

/** Precandidatos pendientes de aprobación. */
export async function listarPrecandidatos() {
  const emprendedores = await prisma.emprendedor.findMany({
    where: { estadoPrecandidato: "pendiente" },
    include: { formularios: true },
    orderBy: { fechaRegistro: "asc" },
  })

  const resultado = []
  for (const emp of emprendedores) {
    const formulario = emp.formularios[0]
    if (!formulario) continue

    const [vista, nombreRespuesta] = await Promise.all([
      prisma.vistaCaracterizacionFormulario.findUnique({ where: { idFormulario: formulario.idFormulario } }),
      prisma.respuesta.findFirst({
        where: { idFormulario: formulario.idFormulario, pregunta: { codigo: "nombre_emprendimiento" } },
        select: { textoLibre: true },
      }),
    ])
    const caracterizacion = filaAcaracterizacion(vista)

    resultado.push({
      idFormulario: formulario.idFormulario,
      nombre: emp.nombre,
      correo: emp.correo,
      numeroIdentificacion: emp.numeroIdentificacion,
      fechaRespuesta: formulario.fechaRespuesta.toISOString(),
      nombreEmprendimientoPropuesto: nombreRespuesta?.textoLibre ?? null,
      sectorPropuesto: caracterizacion.sector,
      descripcionPropuesta: caracterizacion.descripcion,
      caracterizacion,
      programaAcademico: emp.programaAcademico,
      semestre: emp.semestre,
      jornada: emp.jornada,
      fechaNacimiento: emp.fechaNacimiento ? emp.fechaNacimiento.toISOString().slice(0, 10) : null,
    })
  }
  return resultado
}

/**
 * Aprobar crea la cuenta de emprendedor y el emprendimiento (nace sin fase
 * todavía; el diagnóstico inicial la asigna después). Rechazar solo marca la decisión.
 */
export async function decidirPrecandidato(idFormulario: number, decision: "aprobado" | "rechazado") {
  const formulario = await prisma.formulario.findUnique({
    where: { idFormulario },
    include: { emprendedor: true },
  })
  if (!formulario) {
    throw new ErrorApi(404, "Precandidato no encontrado.")
  }
  if (formulario.emprendedor.estadoPrecandidato !== "pendiente") {
    throw new ErrorApi(400, "Este precandidato ya fue evaluado.")
  }

  if (decision === "rechazado") {
    await prisma.emprendedor.update({
      where: { idEmprendedor: formulario.idEmprendedor },
      data: { estadoPrecandidato: "rechazado" },
    })
    return { emprendimientoCreado: false as const }
  }

  await crearCuentaEmprendedor(formulario.idEmprendedor)

  const nombreRespuesta = await prisma.respuesta.findFirst({
    where: { idFormulario, pregunta: { codigo: "nombre_emprendimiento" } },
    select: { textoLibre: true },
  })

  const emprendimiento = await prisma.emprendimiento.create({
    data: {
      idFormulario,
      nombreReferencia: nombreRespuesta?.textoLibre ?? formulario.emprendedor.nombre,
      estado: "activo",
      fechaIngreso: new Date(),
    },
  })

  await prisma.emprendedorEmprendimiento.create({
    data: { idEmprendedor: formulario.idEmprendedor, idEmprendimiento: emprendimiento.idEmprendimiento },
  })

  return { emprendimientoCreado: true as const, idEmprendimiento: emprendimiento.idEmprendimiento }
}
