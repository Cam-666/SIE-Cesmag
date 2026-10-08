import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface PuntoTendencia {
  mes: string
  ingresos: number
  culminaciones: number
}

interface TendenciaMensualChartProps {
  datos: PuntoTendencia[]
}

const ALTO = 220
const ANCHO = 600
const PADDING_IZQ = 26
const PADDING_DER = 8
const PADDING_SUP = 22
const PADDING_INF = 26
const ANCHO_BARRA = 10
const SEPARACION_BARRAS = 3

/**
 * Cambio en el tiempo (RF-17: "cantidad de ingresos y culminaciones por
 * periodo") — barras agrupadas por mes (una para ingresos, una para
 * culminaciones) con el valor siempre visible encima de cada barra, igual
 * principio que un dashboard de indicadores: la cifra se lee de un vistazo,
 * sin depender de pasar el cursor. Cada barra es además interactiva (resalta
 * y muestra un tooltip al pasar el mouse), con el mismo componente de
 * Tooltip que el resto de la app. Colores ya validados contra daltonismo en
 * esta misma paleta (ver "Retención vs. deserción" en Reportes).
 */
export function TendenciaMensualChart({ datos }: TendenciaMensualChartProps) {
  const max = Math.max(1, ...datos.map((d) => Math.max(d.ingresos, d.culminaciones)))
  const anchoUtil = ANCHO - PADDING_IZQ - PADDING_DER
  const altoUtil = ALTO - PADDING_SUP - PADDING_INF
  const anchoGrupo = datos.length > 0 ? anchoUtil / datos.length : 0

  const y = (valor: number) => PADDING_SUP + altoUtil - (valor / max) * altoUtil
  const alturaBarra = (valor: number) => (valor / max) * altoUtil

  const marcasY = [0, 0.5, 1].map((f) => Math.round(max * f))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ backgroundColor: "var(--chart-1)" }} />
          <span className="text-muted-foreground">Ingresos</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ backgroundColor: "var(--chart-2)" }} />
          <span className="text-muted-foreground">Culminaciones</span>
        </span>
      </div>

      <div className="relative w-full" style={{ aspectRatio: `${ANCHO} / ${ALTO}` }}>
        <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} className="absolute inset-0 h-full w-full" role="img" aria-label="Ingresos y culminaciones por mes">
          {marcasY.map((valor) => (
            <g key={valor}>
              <line
                x1={PADDING_IZQ}
                x2={ANCHO - PADDING_DER}
                y1={y(valor)}
                y2={y(valor)}
                className="stroke-border"
                strokeWidth={1}
              />
              <text x={0} y={y(valor)} dy={3} className="fill-muted-foreground text-[9px]" style={{ fontVariantNumeric: "tabular-nums" }}>
                {valor}
              </text>
            </g>
          ))}

          {datos.map((d, i) => {
            const centroGrupo = PADDING_IZQ + i * anchoGrupo + anchoGrupo / 2
            const xIngresos = centroGrupo - SEPARACION_BARRAS / 2 - ANCHO_BARRA
            const xCulminaciones = centroGrupo + SEPARACION_BARRAS / 2
            const hIngresos = alturaBarra(d.ingresos)
            const hCulminaciones = alturaBarra(d.culminaciones)
            const baseline = PADDING_SUP + altoUtil

            return (
              <g key={d.mes}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <rect
                      x={xIngresos}
                      y={baseline - hIngresos}
                      width={ANCHO_BARRA}
                      height={Math.max(hIngresos, d.ingresos > 0 ? 2 : 0)}
                      rx={2}
                      fill="var(--chart-1)"
                      className="cursor-default transition-opacity hover:opacity-75"
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    {d.mes}: {d.ingresos} {d.ingresos === 1 ? "ingreso" : "ingresos"}
                  </TooltipContent>
                </Tooltip>
                {d.ingresos > 0 && (
                  <text
                    x={xIngresos + ANCHO_BARRA / 2}
                    y={baseline - hIngresos - 4}
                    textAnchor="middle"
                    className="fill-foreground text-[9px] font-medium"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {d.ingresos}
                  </text>
                )}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <rect
                      x={xCulminaciones}
                      y={baseline - hCulminaciones}
                      width={ANCHO_BARRA}
                      height={Math.max(hCulminaciones, d.culminaciones > 0 ? 2 : 0)}
                      rx={2}
                      fill="var(--chart-2)"
                      className="cursor-default transition-opacity hover:opacity-75"
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    {d.mes}: {d.culminaciones} {d.culminaciones === 1 ? "culminación" : "culminaciones"}
                  </TooltipContent>
                </Tooltip>
                {d.culminaciones > 0 && (
                  <text
                    x={xCulminaciones + ANCHO_BARRA / 2}
                    y={baseline - hCulminaciones - 4}
                    textAnchor="middle"
                    className="fill-foreground text-[9px] font-medium"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {d.culminaciones}
                  </text>
                )}

                <text x={centroGrupo} y={ALTO - 8} textAnchor="middle" className="fill-muted-foreground text-[9px] capitalize">
                  {d.mes}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
