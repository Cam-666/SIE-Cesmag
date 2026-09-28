import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { AlertTriangle, CalendarClock } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/EmptyState"
import { ESTADO_AGENDA_BADGE } from "@/domain/agenda/display"
import type { Agenda } from "@/domain/agenda/types"

interface SelectorHorarioAgendaProps {
  bloques: Agenda[] | undefined
  isPending: boolean
  isError?: boolean
  value: string
  onChange: (idAgenda: string) => void
  /** Días futuros disponibles: descripción cuando no hay ninguno cargado aún. */
  mensajeVacio?: string
}

/**
 * Selector de horario a partir de bloques reales de AGENDA, agrupados por
 * día. Solo los bloques "disponible" son seleccionables; los demás muestran
 * su estado. Si el bloque trae `asesorNombre` (agenda combinada de varias
 * personas), se muestra debajo de la hora.
 */
export function SelectorHorarioAgenda({
  bloques,
  isPending,
  isError,
  value,
  onChange,
  mensajeVacio = "Aún no hay bloques de disponibilidad configurados.",
}: SelectorHorarioAgendaProps) {
  if (isPending) {
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    )
  }

  if (isError) {
    return <EmptyState icon={AlertTriangle} title="No se pudieron cargar los horarios" />
  }

  if (!bloques || bloques.length === 0) {
    return <EmptyState icon={CalendarClock} title="Sin horarios" description={mensajeVacio} />
  }

  const porFecha = new Map<string, Agenda[]>()
  bloques.forEach((b) => {
    const lista = porFecha.get(b.fecha) ?? []
    lista.push(b)
    porFecha.set(b.fecha, lista)
  })

  return (
    <div className="flex max-h-72 flex-col gap-3 overflow-y-auto">
      {Array.from(porFecha.entries()).map(([fecha, lista]) => (
        <div key={fecha}>
          <p className="mb-1.5 text-xs font-medium capitalize text-muted-foreground">
            {format(parseISO(fecha), "EEEE d 'de' MMMM", { locale: es })}
          </p>
          <div className="flex flex-wrap gap-2">
            {lista.map((bloque) => {
              const seleccionado = value === String(bloque.idAgenda)
              const seleccionable = bloque.estado === "disponible"
              return (
                <button
                  key={bloque.idAgenda}
                  type="button"
                  disabled={!seleccionable}
                  onClick={() => onChange(String(bloque.idAgenda))}
                  title={!seleccionable ? ESTADO_AGENDA_BADGE[bloque.estado].label : undefined}
                  className={`flex flex-col items-center rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    seleccionado
                      ? "border-primary-700 bg-primary-700 text-white"
                      : seleccionable
                        ? "border-border text-foreground hover:bg-muted"
                        : "cursor-not-allowed border-border/60 text-muted-foreground/50"
                  }`}
                >
                  {bloque.horaInicio}
                  {bloque.asesorNombre && (
                    <span
                      className={`text-[10px] font-normal ${seleccionado ? "text-white/80" : "text-muted-foreground"}`}
                    >
                      {bloque.asesorNombre}
                    </span>
                  )}
                  {!seleccionable && (
                    <span className="text-[10px] font-normal">{ESTADO_AGENDA_BADGE[bloque.estado].label}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
