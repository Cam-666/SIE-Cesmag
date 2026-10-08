import { useState, type ReactNode } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarX2 } from "lucide-react"
import { CalendarioMensual } from "@/components/shared/CalendarioMensual"
import { agruparEnTramos, type TramoAgenda } from "@/domain/agenda/display"
import type { Agenda } from "@/domain/agenda/types"
import { ahoraComoFechaAsesoria } from "@/lib/fecha-asesoria"

interface AgendaCalendarioListaProps {
  bloques: Agenda[]
  /** Clases Tailwind por estado del tramo (fondo/borde/texto de cada fila). */
  colorPorEstado: Record<TramoAgenda["estado"], string>
  /** Tramo que debe quedar resaltado (p. ej. el elegido como hora de inicio). */
  tramoResaltadoId?: number
  onSeleccionarTramo: (tramo: TramoAgenda) => void
  /** Cuándo un tramo no es clicable (p. ej. ya reservado, en la vista del emprendedor). */
  tramoDeshabilitado?: (tramo: TramoAgenda) => boolean
  /** Fechas extra a marcar con punto además de las de `bloques` (p. ej. asesorías ya ocurridas, sin bloque propio). */
  fechasExtra?: Set<string>
  /** Qué mostrar cuando el día elegido no tiene bloques — por defecto, "Sin bloques este día" en gris. */
  contenidoVacio?: (fecha: string) => ReactNode
}

/**
 * Selector de fecha + lista de horarios, al estilo Calendly/Google Calendar:
 * un calendario de mes de verdad (el patrón que cualquiera reconoce de
 * inmediato) para elegir el día, y al lado/debajo solo los tramos que
 * realmente existen ese día — nunca una cuadrícula de horas fija que se ve
 * vacía la mayoría de los días. La navegación entre meses es libre (incluye
 * meses pasados, para poder revisar) — lo que sí queda acotado al mes
 * actual es la propia disponibilidad (no existen bloques fuera de esa
 * ventana, por construcción del backend).
 */
export function AgendaCalendarioLista({
  bloques,
  colorPorEstado,
  tramoResaltadoId,
  onSeleccionarTramo,
  tramoDeshabilitado,
  fechasExtra,
  contenidoVacio,
}: AgendaCalendarioListaProps) {
  const tramos = agruparEnTramos(bloques)
  const fechasConEvento = new Set([...tramos.map((t) => t.fecha), ...(fechasExtra ?? [])])

  // Como un calendario de verdad: arranca en el día de hoy, no en el primer
  // bloque que haya (que podría estar semanas adelante y confundir). Se usa
  // `toISOString` (no `format` de date-fns) para leer los componentes UTC
  // crudos de `ahoraComoFechaAsesoria`, no los de la zona horaria del navegador.
  const hoy = ahoraComoFechaAsesoria().toISOString().slice(0, 10)
  const [mes, setMes] = useState(() => new Date(`${hoy}T00:00:00`))
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoy)

  const tramosDelDia = tramos
    .filter((t) => t.fecha === fechaSeleccionada)
    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[auto_1fr]">
      <div className="md:w-72">
        <CalendarioMensual
          mes={mes}
          onCambiarMes={setMes}
          fechasConEvento={fechasConEvento}
          fechaSeleccionada={fechaSeleccionada}
          onSeleccionarFecha={setFechaSeleccionada}
        />
      </div>

      <div className="flex flex-col gap-2 border-border md:border-l md:pl-6">
        <p className="text-sm font-semibold capitalize text-primary-900">
          {format(new Date(`${fechaSeleccionada}T00:00:00`), "EEEE d 'de' MMMM", { locale: es })}
        </p>

        {tramosDelDia.length === 0 &&
          (contenidoVacio ? (
            contenidoVacio(fechaSeleccionada)
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-10 text-center">
              <CalendarX2 className="size-5 text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground">Sin bloques este día.</p>
            </div>
          ))}

        <div className="flex flex-col gap-2">
          {tramosDelDia.map((tramo) => {
            const deshabilitado = tramoDeshabilitado?.(tramo) ?? false
            const resaltado = tramo.ids.includes(tramoResaltadoId ?? -1)
            return (
              <button
                key={tramo.ids[0]}
                type="button"
                disabled={deshabilitado}
                onClick={() => onSeleccionarTramo(tramo)}
                className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition-all ${
                  deshabilitado ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:brightness-95"
                } ${colorPorEstado[tramo.estado]} ${resaltado ? "ring-2 ring-primary-700 ring-offset-1" : ""}`}
              >
                <span className="font-medium">
                  {tramo.horaInicio} – {tramo.horaFin}
                </span>
                {(tramo.asesorNombre || tramo.emprendimiento) && (
                  <span className="truncate text-xs opacity-80">{tramo.emprendimiento ?? tramo.asesorNombre}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
