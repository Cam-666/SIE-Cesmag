import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface StatCardProps {
  label: string
  value: number | string
  icon: LucideIcon
  loading?: boolean
  /** Alterna el acento del ícono entre azul y rojo institucional (armonía de marca). */
  accent?: "primary" | "destructive"
}

/** Tarjeta de indicador (KPI) usada en Dashboard y Reportes e Indicadores. */
export function StatCard({ label, value, icon: Icon, loading, accent = "primary" }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <span
          className={
            accent === "primary"
              ? "flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-700/10 text-primary-700"
              : "flex size-10 shrink-0 items-center justify-center rounded-lg bg-destructive-600/10 text-destructive-600"
          }
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-1 h-7 w-16" />
          ) : (
            <p className="text-2xl font-semibold text-primary-900">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
