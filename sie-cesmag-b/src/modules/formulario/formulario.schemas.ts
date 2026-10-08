import { z } from "zod"

const respuestaEntradaSchema = z.object({
  codigo: z.string().min(1),
  texto: z.string().optional(),
  numero: z.number().optional(),
  esOtro: z.boolean().optional(),
})

/**
 * Lo que envía la integración con Google Forms por cada envío de la encuesta
 * de caracterización. `filtroInicial` es la pregunta 1 (rama de la
 * encuesta); `quiereAcompanamiento` es la pregunta 26, la que decide si esto
 * se incorpora como precandidato o se descarta.
 */
export const recibirFormularioSchema = z.object({
  numeroIdentificacion: z.string().min(1, "Número de identificación obligatorio."),
  nombre: z.string().min(1, "Nombre obligatorio."),
  correo: z.string().email("Correo inválido."),
  filtroInicial: z.enum(["activo", "idea", "futuro", "no_interesa"]),
  quiereAcompanamiento: z.boolean(),
  respuestas: z.array(respuestaEntradaSchema),
})

/** Decisión sobre un precandidato: aprobar o rechazar. */
export const decisionPrecandidatoSchema = z.object({
  decision: z.enum(["aprobado", "rechazado"]),
})
