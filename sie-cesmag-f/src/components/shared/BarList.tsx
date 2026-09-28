import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface BarListItem {
  id: string | number
  label: string
  value: number
}

interface BarListProps {
  items: BarListItem[]
  /** Clase Tailwind de fondo para la barra (una sola serie => un solo color). */
  colorClassName?: string
}

/** Lista de barras horizontales de una sola serie (magnitud por categoría), con tooltip por barra. */
export function BarList({ items, colorClassName = "bg-primary-600" }: BarListProps) {
  const max = Math.max(1, ...items.map((i) => i.value))

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <Tooltip key={item.id}>
          <TooltipTrigger asChild>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate text-foreground">{item.label}</span>
                <span className="font-medium text-foreground">{item.value}</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-r-full transition-all ${colorClassName}`}
                  style={{ width: `${(item.value / max) * 100}%` }}
                />
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {item.label}: {item.value}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  )
}
