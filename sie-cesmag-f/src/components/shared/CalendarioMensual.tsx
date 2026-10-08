import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CalendarioMensualProps {
  mes: Date
  onCambiarMes: (siguienteMes: Date) => void
  /** Fechas ("yyyy-MM-dd") que deben marcarse con un punto (tienen eventos). */
  fechasConEvento: Set<string>
  fechaSeleccionada: string | null
  onSeleccionarFecha: (fecha: string) => void
  /** Si vienen, deshabilita navegar (y seleccionar día) fuera de este rango "yyyy-MM-dd". */
  fechaMinima?: string
  fechaMaxima?: string
}

const DIAS_CABECERA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

/** Calendario mensual genérico (solo lectura + selección de día), sin librerías externas. */
export function CalendarioMensual({
  mes,
  onCambiarMes,
  fechasConEvento,
  fechaSeleccionada,
  onSeleccionarFecha,
  fechaMinima,
  fechaMaxima,
}: CalendarioMensualProps) {
  const inicioMalla = startOfWeek(startOfMonth(mes), { weekStartsOn: 1 })
  const finMalla = endOfWeek(endOfMonth(mes), { weekStartsOn: 1 })
  const dias = eachDayOfInterval({ start: inicioMalla, end: finMalla })

  const finDelMesAnterior = format(subMonths(endOfMonth(mes), 1), "yyyy-MM-dd")
  const inicioDelMesSiguiente = format(addMonths(startOfMonth(mes), 1), "yyyy-MM-dd")
  const noHayMesAnterior = fechaMinima !== undefined && finDelMesAnterior < fechaMinima
  const noHayMesSiguiente = fechaMaxima !== undefined && inicioDelMesSiguiente > fechaMaxima

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold capitalize text-primary-900">
          {format(mes, "MMMM yyyy", { locale: es })}
        </p>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Mes anterior"
            disabled={noHayMesAnterior}
            onClick={() => onCambiarMes(subMonths(mes, 1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Mes siguiente"
            disabled={noHayMesSiguiente}
            onClick={() => onCambiarMes(addMonths(mes, 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {DIAS_CABECERA.map((d) => (
          <div key={d} className="py-1 font-medium">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {dias.map((dia) => {
          const fechaStr = format(dia, "yyyy-MM-dd")
          const dentroDelMes = isSameMonth(dia, mes)
          const tieneEvento = fechasConEvento.has(fechaStr)
          const seleccionado = fechaSeleccionada === fechaStr
          const fueraDeRango = (fechaMinima !== undefined && fechaStr < fechaMinima) || (fechaMaxima !== undefined && fechaStr > fechaMaxima)

          return (
            <button
              key={fechaStr}
              type="button"
              disabled={fueraDeRango}
              onClick={() => onSeleccionarFecha(fechaStr)}
              className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg text-sm transition-colors ${
                fueraDeRango ? "cursor-not-allowed text-muted-foreground/25" : !dentroDelMes ? "text-muted-foreground/40" : "text-foreground"
              } ${seleccionado ? "bg-primary-700 text-white" : fueraDeRango ? "" : "hover:bg-muted"} ${
                isToday(dia) && !seleccionado ? "font-semibold text-primary-700" : ""
              }`}
            >
              {format(dia, "d")}
              {tieneEvento && (
                <span
                  className={`size-1.5 rounded-full ${seleccionado ? "bg-white" : "bg-destructive-600"}`}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
