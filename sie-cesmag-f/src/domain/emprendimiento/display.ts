import type { CaracterizacionEmprendimiento, EstadoEmprendimiento } from "@/domain/emprendimiento/types"

export const ESTADO_EMPRENDIMIENTO_BADGE: Record<
  EstadoEmprendimiento,
  { label: string; variant: "default" | "destructive" | "secondary" }
> = {
  activo: { label: "Activo", variant: "default" },
  inactivo: { label: "Inactivo", variant: "destructive" },
  terminado: { label: "Terminado", variant: "secondary" },
}

export function codigoEmprendimiento(id: number) {
  return `EM-${String(id).padStart(6, "0")}`
}

/**
 * Días sin actividad a partir de los cuales un emprendimiento "activo" se
 * marca en riesgo de abandono. Valor de referencia, ajustable cuando la
 * dependencia lo formalice oficialmente.
 */
export const UMBRAL_DIAS_SIN_ACTIVIDAD = 15

/** Solo aplica a emprendimientos "activo": inactivo/terminado ya tienen su propio estado explícito. */
export function estaSinActividadReciente(estado: EstadoEmprendimiento, ultimaActividad: string) {
  if (estado !== "activo") return false
  const dias = (Date.now() - new Date(ultimaActividad).getTime()) / (1000 * 60 * 60 * 24)
  return dias >= UMBRAL_DIAS_SIN_ACTIVIDAD
}

/**
 * Agrupación de los campos de `CaracterizacionEmprendimiento` por bloque del
 * formulario, reutilizada tanto para mostrarlos en solo lectura como para
 * editarlos.
 */
export const CARACTERIZACION_GRUPOS: {
  titulo: string
  campos: { campo: keyof CaracterizacionEmprendimiento; label: string; tipo?: "numero" | "texto" }[]
}[] = [
  {
    titulo: "Caracterización del emprendimiento",
    campos: [
      { campo: "sector", label: "Sector" },
      { campo: "origenIdea", label: "¿Cómo surgió la idea?" },
      { campo: "tipoClientes", label: "Tipo de clientes" },
      { campo: "queOfrece", label: "¿Qué ofrece principalmente?" },
      { campo: "tiempoOperando", label: "Tiempo operando" },
      { campo: "nivelFormalizacion", label: "Nivel de formalización" },
      { campo: "descripcion", label: "Descripción del negocio" },
    ],
  },
  {
    titulo: "Validación y tracción",
    campos: [
      { campo: "nivelValidacion", label: "Nivel de validación de mercado" },
      { campo: "tieneVentas", label: "¿Tiene ventas actualmente?" },
      { campo: "alcanceVentas", label: "Alcance de las ventas" },
      { campo: "situacionFinanciera", label: "Situación financiera" },
    ],
  },
  {
    titulo: "Madurez financiera",
    campos: [
      { campo: "registroFinanciero", label: "Registro financiero/contable" },
      { campo: "conoceCostos", label: "¿Conoce su estructura de costos?" },
    ],
  },
  {
    titulo: "Estructura y operación",
    campos: [
      { campo: "numeroPersonas", label: "Personas vinculadas", tipo: "numero" },
      { campo: "canalVentas", label: "Canal principal de ventas" },
      { campo: "herramientasDigitales", label: "Herramientas digitales" },
    ],
  },
  {
    titulo: "Innovación y escalabilidad",
    campos: [
      { campo: "tipoInnovacion", label: "Tipo de innovación" },
      { campo: "fuenteFinanciacion", label: "¿Ha buscado inversión externa?" },
    ],
  },
  {
    titulo: "Necesidades estratégicas",
    campos: [
      { campo: "necesidadesEstrategicas", label: "Necesidad principal" },
      { campo: "temasAcompanamiento", label: "Temas de acompañamiento deseados" },
    ],
  },
]
