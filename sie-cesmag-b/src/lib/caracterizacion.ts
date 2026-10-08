import { prisma } from "./prisma.js"

/**
 * Forma que ya espera el frontend (`domain/emprendimiento/types.ts` →
 * `CaracterizacionEmprendimiento`) — 20 campos, sin los de perfil del
 * estudiante (esos ahora viven en EMPRENDEDOR). Los 4 de selección
 * múltiple se guardan/leen como texto separado por comas: por dentro son
 * varias filas de RESPUESTA, pero el frontend nunca necesita saberlo.
 */
export interface CaracterizacionEmprendimiento {
  sector: string | null
  origenIdea: string | null
  tipoClientes: string | null
  queOfrece: string | null
  tiempoOperando: string | null
  nivelFormalizacion: string | null
  descripcion: string | null
  nivelValidacion: string | null
  tieneVentas: string | null
  alcanceVentas: string | null
  situacionFinanciera: string | null
  registroFinanciero: string | null
  conoceCostos: string | null
  numeroPersonas: number | null
  canalVentas: string | null
  herramientasDigitales: string | null
  tipoInnovacion: string | null
  fuenteFinanciacion: string | null
  necesidadesEstrategicas: string | null
  temasAcompanamiento: string | null
}

type CampoCaracterizacion = keyof CaracterizacionEmprendimiento

/** Traduce cada campo del objeto plano al `codigo` de PREGUNTA correspondiente (bloques 3 a 8). */
const CAMPOS: { campo: CampoCaracterizacion; codigo: string; tipo: "texto" | "numero" | "multi" }[] = [
  { campo: "sector", codigo: "sector", tipo: "multi" },
  { campo: "origenIdea", codigo: "origen_idea", tipo: "multi" },
  { campo: "tipoClientes", codigo: "tipo_clientes", tipo: "multi" },
  { campo: "queOfrece", codigo: "que_ofrece", tipo: "texto" },
  { campo: "tiempoOperando", codigo: "tiempo_operando", tipo: "texto" },
  { campo: "nivelFormalizacion", codigo: "nivel_formalizacion", tipo: "texto" },
  { campo: "descripcion", codigo: "descripcion_negocio", tipo: "texto" },
  { campo: "nivelValidacion", codigo: "nivel_validacion", tipo: "texto" },
  { campo: "tieneVentas", codigo: "tiene_ventas", tipo: "texto" },
  { campo: "alcanceVentas", codigo: "alcance_ventas", tipo: "texto" },
  { campo: "situacionFinanciera", codigo: "situacion_financiera", tipo: "texto" },
  { campo: "registroFinanciero", codigo: "registro_financiero", tipo: "texto" },
  { campo: "conoceCostos", codigo: "conoce_costos", tipo: "texto" },
  { campo: "numeroPersonas", codigo: "numero_personas", tipo: "numero" },
  { campo: "canalVentas", codigo: "canal_ventas", tipo: "multi" },
  { campo: "herramientasDigitales", codigo: "herramientas_digitales", tipo: "multi" },
  { campo: "tipoInnovacion", codigo: "tipo_innovacion", tipo: "multi" },
  { campo: "fuenteFinanciacion", codigo: "fuente_financiacion", tipo: "multi" },
  { campo: "necesidadesEstrategicas", codigo: "necesidades_estrategicas", tipo: "multi" },
  { campo: "temasAcompanamiento", codigo: "temas_acompanamiento", tipo: "multi" },
]

type FilaVista = {
  sector: string[]
  origenIdea: string[]
  tipoClientes: string[]
  queOfrece: string | null
  tiempoOperando: string | null
  nivelFormalizacion: string | null
  descripcion: string | null
  nivelValidacion: string | null
  tieneVentas: string | null
  alcanceVentas: string | null
  situacionFinanciera: string | null
  registroFinanciero: string | null
  conoceCostos: string | null
  numeroPersonas: number | null
  canalVentas: string[]
  herramientasDigitales: string[]
  tipoInnovacion: string[]
  fuenteFinanciacion: string[]
  necesidadesEstrategicas: string[]
  temasAcompanamiento: string[]
}

const CARACTERIZACION_VACIA: CaracterizacionEmprendimiento = {
  sector: null,
  origenIdea: null,
  tipoClientes: null,
  queOfrece: null,
  tiempoOperando: null,
  nivelFormalizacion: null,
  descripcion: null,
  nivelValidacion: null,
  tieneVentas: null,
  alcanceVentas: null,
  situacionFinanciera: null,
  registroFinanciero: null,
  conoceCostos: null,
  numeroPersonas: null,
  canalVentas: null,
  herramientasDigitales: null,
  tipoInnovacion: null,
  fuenteFinanciacion: null,
  necesidadesEstrategicas: null,
  temasAcompanamiento: null,
}

/** Convierte una fila de `vista_caracterizacion`/`vista_caracterizacion_formulario` al objeto plano del frontend. */
export function filaAcaracterizacion(fila: FilaVista | null): CaracterizacionEmprendimiento {
  if (!fila) return CARACTERIZACION_VACIA
  return {
    sector: fila.sector.length ? fila.sector.join(", ") : null,
    origenIdea: fila.origenIdea.length ? fila.origenIdea.join(", ") : null,
    tipoClientes: fila.tipoClientes.length ? fila.tipoClientes.join(", ") : null,
    queOfrece: fila.queOfrece,
    tiempoOperando: fila.tiempoOperando,
    nivelFormalizacion: fila.nivelFormalizacion,
    descripcion: fila.descripcion,
    nivelValidacion: fila.nivelValidacion,
    tieneVentas: fila.tieneVentas,
    alcanceVentas: fila.alcanceVentas,
    situacionFinanciera: fila.situacionFinanciera,
    registroFinanciero: fila.registroFinanciero,
    conoceCostos: fila.conoceCostos,
    numeroPersonas: fila.numeroPersonas,
    canalVentas: fila.canalVentas.length ? fila.canalVentas.join(", ") : null,
    herramientasDigitales: fila.herramientasDigitales.length ? fila.herramientasDigitales.join(", ") : null,
    tipoInnovacion: fila.tipoInnovacion.length ? fila.tipoInnovacion.join(", ") : null,
    fuenteFinanciacion: fila.fuenteFinanciacion.length ? fila.fuenteFinanciacion.join(", ") : null,
    necesidadesEstrategicas: fila.necesidadesEstrategicas.length ? fila.necesidadesEstrategicas.join(", ") : null,
    temasAcompanamiento: fila.temasAcompanamiento.length ? fila.temasAcompanamiento.join(", ") : null,
  }
}

/**
 * Reemplaza en RESPUESTA los valores de los campos de caracterización de un
 * formulario — borra las filas viejas de cada pregunta tocada e inserta las
 * nuevas, así sirve igual para un campo de texto (una fila) o uno de
 * selección múltiple separado por comas (varias filas).
 */
export async function guardarCaracterizacion(idFormulario: number, datos: CaracterizacionEmprendimiento) {
  const preguntas = await prisma.pregunta.findMany({ where: { codigo: { in: CAMPOS.map((c) => c.codigo) } } })
  const idPorCodigo = new Map(preguntas.map((p) => [p.codigo, p.idPregunta]))

  const aInsertar: { idFormulario: number; idPregunta: number; textoLibre: string | null; valorNumero: number | null }[] = []
  for (const { campo, codigo, tipo } of CAMPOS) {
    const idPregunta = idPorCodigo.get(codigo)
    if (!idPregunta) continue
    const valor = datos[campo]

    if (tipo === "multi") {
      const partes = (valor as string | null)?.split(",").map((s) => s.trim()).filter(Boolean) ?? []
      for (const parte of partes) {
        aInsertar.push({ idFormulario, idPregunta, textoLibre: parte, valorNumero: null })
      }
    } else if (tipo === "numero") {
      if (valor !== null && valor !== undefined) {
        aInsertar.push({ idFormulario, idPregunta, textoLibre: null, valorNumero: valor as number })
      }
    } else if (valor !== null && valor !== undefined && valor !== "") {
      aInsertar.push({ idFormulario, idPregunta, textoLibre: valor as string, valorNumero: null })
    }
  }

  await prisma.$transaction([
    prisma.respuesta.deleteMany({ where: { idFormulario, idPregunta: { in: [...idPorCodigo.values()] } } }),
    prisma.respuesta.createMany({ data: aInsertar }),
  ])
}
