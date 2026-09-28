import type { Etapa, Fase } from "@/domain/ruta/types"

/**
 * Catálogo fijo de las 3 etapas y 12 fases de la ruta metodológica CESMAG-EI
 * (Manual Operativo v2.0). Es información estable que no cambia sin una
 * revisión anual del manual, así que se expone como constante en vez de
 * requerir una consulta a la API.
 */
export const ETAPAS: Etapa[] = [
  {
    idEtapa: 1,
    numero: 1,
    nombre: "Formación e Ideación",
    descripcion: "Semestres 1 a 6, integración curricular obligatoria (PIEI).",
  },
  {
    idEtapa: 2,
    numero: 2,
    nombre: "Incubación",
    descripcion: "Proyectos validados — acceso voluntario desde cualquier semestre.",
  },
  {
    idEtapa: 3,
    numero: 3,
    nombre: "Aceleración y Escala",
    descripcion: null,
  },
]

/** `entregablesRequeridos` es el entregable obligatorio de cada fase (Manual Operativo, ER: FASE.entregables_requeridos). */
export const FASES: Fase[] = [
  // Etapa I — Formación e Ideación
  {
    idFase: 1,
    idEtapa: 1,
    numero: 1,
    nombre: "Mentalidad EI",
    entregablesRequeridos:
      "Portafolio de oportunidades identificadas en el entorno + reflexión de perfil emprendedor personal.",
  },
  {
    idFase: 2,
    idEtapa: 1,
    numero: 2,
    nombre: "Empatía",
    entregablesRequeridos:
      "Ficha de usuario validada con evidencias fotográficas/audiovisuales + insight central.",
  },
  {
    idFase: 3,
    idEtapa: 1,
    numero: 3,
    nombre: "Definición del Reto",
    entregablesRequeridos:
      "Declaración de reto estructurada (POV + HMW) + mapa de actores del ecosistema del problema.",
  },
  {
    idFase: 4,
    idEtapa: 1,
    numero: 4,
    nombre: "Ideación Estratégica",
    entregablesRequeridos:
      "Top 3 ideas seleccionadas con sustento metodológico + concepto de solución elegido con justificación.",
  },
  {
    idFase: 5,
    idEtapa: 1,
    numero: 5,
    nombre: "Prototipado Rápido",
    entregablesRequeridos: "Prototipo físico o digital de baja/media fidelidad + guía de prueba con usuarios.",
  },
  {
    idFase: 6,
    idEtapa: 1,
    numero: 6,
    nombre: "Validación Real",
    entregablesRequeridos:
      "Informe de validación con % de aceptación, nivel de interés, feedback estructurado y decisión (continuar, pivotar o discontinuar).",
  },
  // Etapa II — Incubación
  {
    idFase: 7,
    idEtapa: 2,
    numero: 7,
    nombre: "Modelamiento Empresarial",
    entregablesRequeridos: "Canvas validado con evidencias de usuarios + informe de análisis de mercado.",
  },
  {
    idFase: 8,
    idEtapa: 2,
    numero: 8,
    nombre: "Estructuración Financiera y Jurídica",
    entregablesRequeridos: "Modelo financiero en Excel + acta de constitución o minuta + solicitud de marca.",
  },
  {
    idFase: 9,
    idEtapa: 2,
    numero: 9,
    nombre: "Preparación para el Mercado",
    entregablesRequeridos:
      "Pitch deck finalizado + video pitch de 3 minutos + primeras ventas o cartas de intención de compra.",
  },
  // Etapa III — Aceleración y Escala
  {
    idFase: 10,
    idEtapa: 3,
    numero: 10,
    nombre: "Pitch",
    entregablesRequeridos: "Presentación ante el Comité de Selección de la Unidad.",
  },
  {
    idFase: 11,
    idEtapa: 3,
    numero: 11,
    nombre: "Financiamiento Externo",
    entregablesRequeridos: "Vinculación a Fondo Emprender SENA, Innpulsa u otra fuente de financiamiento.",
  },
  {
    idFase: 12,
    idEtapa: 3,
    numero: 12,
    nombre: "Lanzamiento y Escala",
    entregablesRequeridos: "Seguimiento trimestral con indicadores de sostenibilidad.",
  },
]
