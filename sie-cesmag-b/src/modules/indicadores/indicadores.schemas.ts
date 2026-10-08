import { z } from "zod"

/** Acota los indicadores a un rango de fechas — opcional, "todo el periodo" si se omite. */
export const filtroPeriodoSchema = z
  .object({
    desde: z.string().optional(),
    hasta: z.string().optional(),
  })
  .transform((v) => ({
    desde: v.desde ? new Date(v.desde) : undefined,
    hasta: v.hasta ? new Date(v.hasta) : undefined,
  }))

export type FiltroPeriodo = z.infer<typeof filtroPeriodoSchema>
