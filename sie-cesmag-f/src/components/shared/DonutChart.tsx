import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface DonutChartItem {
  id: string | number
  label: string
  value: number
}

interface DonutChartProps {
  items: DonutChartItem[]
  /** Colores en orden fijo — nunca se reciclan según el ranking, siempre el mismo color por posición. */
  colores?: string[]
}

const COLORES_POR_DEFECTO = ["var(--chart-1)", "var(--chart-2)", "#AD7A0C", "var(--chart-5)"]

const RADIO = 42
const GROSOR = 16
const CIRCUNFERENCIA = 2 * Math.PI * RADIO

/**
 * Distribución de una sola variable categórica (RF-17 "distribución por
 * etapa"), con dona + leyenda externa con conteo y porcentaje — igual
 * principio que un `BarList` pero mejor para pocas categorías (≤ 4) donde la
 * proporción del total importa más que comparar valores exactos.
 */
export function DonutChart({ items, colores = COLORES_POR_DEFECTO }: DonutChartProps) {
  const total = items.reduce((acc, i) => acc + i.value, 0)
  if (total === 0) {
    return <p className="text-sm text-muted-foreground">Sin datos para mostrar.</p>
  }

  const segmentos: Array<DonutChartItem & { color: string; porcentaje: number; dash: number; offset: number }> = []
  for (const [i, item] of items.entries()) {
    const fraccion = item.value / total
    const acumuladoPrevio = segmentos.length > 0 ? segmentos[segmentos.length - 1] : null
    const offset = acumuladoPrevio ? acumuladoPrevio.offset + acumuladoPrevio.dash : 0
    segmentos.push({
      ...item,
      color: colores[i % colores.length],
      porcentaje: fraccion * 100,
      dash: fraccion * CIRCUNFERENCIA,
      offset,
    })
  }

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-center">
      <div className="relative size-40 shrink-0">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90">
          <circle cx="50" cy="50" r={RADIO} fill="none" stroke="var(--muted)" strokeWidth={GROSOR} />
          {segmentos.map((s) => (
            <Tooltip key={s.id}>
              <TooltipTrigger asChild>
                <circle
                  cx="50"
                  cy="50"
                  r={RADIO}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={GROSOR}
                  strokeDasharray={`${Math.max(s.dash - 1.5, 0)} ${CIRCUNFERENCIA - s.dash + 1.5}`}
                  strokeDashoffset={-s.offset}
                  className="cursor-default transition-opacity hover:opacity-80"
                />
              </TooltipTrigger>
              <TooltipContent>
                {s.label}: {s.value} ({s.porcentaje.toFixed(1)}%)
              </TooltipContent>
            </Tooltip>
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold text-foreground">{total}</span>
          <span className="text-[11px] text-muted-foreground">total</span>
        </div>
      </div>

      <div className="flex w-full flex-col gap-2 sm:w-auto">
        {segmentos.map((s) => (
          <div key={s.id} className="flex items-center gap-2 text-sm">
            <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="min-w-0 flex-1 truncate text-foreground">{s.label}</span>
            <span className="font-medium text-foreground">{s.value}</span>
            <span className="w-14 shrink-0 text-right text-xs text-muted-foreground">
              {s.porcentaje.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
