import { z } from "zod"

/** El motivo es obligatorio salvo que el nuevo estado sea "activo". */
export const cambioEstadoSchema = z
  .object({
    estadoNuevo: z.enum(["activo", "inactivo", "terminado"]),
    motivo: z.string().optional(),
  })
  .refine((data) => data.estadoNuevo === "activo" || (data.motivo?.trim().length ?? 0) > 0, {
    message: "El motivo es obligatorio para este estado.",
    path: ["motivo"],
  })

export type CambioEstadoFormValues = z.infer<typeof cambioEstadoSchema>

/** Registro de reingreso de un emprendimiento inactivo. */
export const reingresoSchema = z.object({
  fechaReingreso: z.string().min(1, "Seleccione la fecha de reingreso."),
})

export type ReingresoFormValues = z.infer<typeof reingresoSchema>

/** Crea un emprendimiento directamente, sin pasar por la aprobación de un precandidato. */
export const crearEmprendimientoSchema = z.object({
  nombreReferencia: z.string().min(1, "Ingrese el nombre del emprendimiento."),
  numeroIdentificacion: z.string().min(1, "Ingrese el número de identificación del fundador."),
  nombre: z.string().min(1, "Ingrese el nombre del fundador."),
  correo: z.string().email("Correo inválido."),
})

export type CrearEmprendimientoFormValues = z.infer<typeof crearEmprendimientoSchema>

/** Datos para agregar un integrante al emprendimiento. */
export const agregarIntegranteSchema = z.object({
  numeroIdentificacion: z.string().min(1, "Ingrese el número de identificación."),
})

export type AgregarIntegranteFormValues = z.infer<typeof agregarIntegranteSchema>

/** Datos para corregir el nombre de un integrante. */
export const editarIntegranteSchema = z.object({
  nombre: z.string().min(1, "Ingrese el nombre."),
})

export type EditarIntegranteFormValues = z.infer<typeof editarIntegranteSchema>

/**
 * Todos los campos de caracterización del negocio se editan como texto
 * (incluso "numeroPersonas", numérico en el dominio) para no complicar el
 * formulario con inputs mixtos; se convierte a número al enviar (ver
 * `EditarCaracterizacionDialog`).
 */
export const caracterizacionSchema = z.object({
  sector: z.string().nullable().optional(),
  origenIdea: z.string().nullable().optional(),
  tipoClientes: z.string().nullable().optional(),
  queOfrece: z.string().nullable().optional(),
  tiempoOperando: z.string().nullable().optional(),
  nivelFormalizacion: z.string().nullable().optional(),
  descripcion: z.string().nullable().optional(),
  nivelValidacion: z.string().nullable().optional(),
  tieneVentas: z.string().nullable().optional(),
  alcanceVentas: z.string().nullable().optional(),
  situacionFinanciera: z.string().nullable().optional(),
  registroFinanciero: z.string().nullable().optional(),
  conoceCostos: z.string().nullable().optional(),
  numeroPersonas: z.string().nullable().optional(),
  canalVentas: z.string().nullable().optional(),
  herramientasDigitales: z.string().nullable().optional(),
  tipoInnovacion: z.string().nullable().optional(),
  fuenteFinanciacion: z.string().nullable().optional(),
  necesidadesEstrategicas: z.string().nullable().optional(),
  temasAcompanamiento: z.string().nullable().optional(),
})

export type CaracterizacionFormValues = z.infer<typeof caracterizacionSchema>
