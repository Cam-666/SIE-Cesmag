import { useState } from "react"
import {
  addDays,
  addWeeks,
  format,
  isSameDay,
  isToday,
  startOfWeek,
  subWeeks,
} from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MODALIDAD_LABEL } from "@/domain/asesoria/display"
import type { AsesoriaListado } from "@/domain/asesoria/types"
import { fechaAsesoriaComoLocal } from "@/lib/fecha-asesoria"

interface CalendarioSemanalProps {
  semana: Date
  onCambiarSemana: (siguienteSemana: Date) => void
  data: AsesoriaListado[]
  mostrarEmprendimiento?: boolean
  onSeleccionar: (asesoria: AsesoriaListado) => void
}

/** Ventana de horas que muestra la grilla — una asesoría fuera de este rango se recorta a los bordes, no desaparece. */
const HORA_INICIO_GRILLA = 7
const HORA_FIN_GRILLA = 20
const TOTAL_MINUTOS_GRILLA = (HORA_FIN_GRILLA - HORA_INICIO_GRILLA) * 60
const ALTO_HORA_PX = 56

const COLOR_POR_ESTADO: Record<AsesoriaListado["estadoAsesoria"], string> = {
  programada: "bg-primary-700 border-primary-800 text-white",
  completada: "bg-muted border-border text-foreground",
  cancelada: "bg-destructive-600/15 border-destructive-600/40 text-destructive-700 line-through",
  no_realizada: "bg-destructive-600/10 border-destructive-600/30 text-destructive-700",
}

function minutosDesdeInicioGrilla(fecha: Date): number {
  const minutosDelDia = fecha.getHours() * 60 + fecha.getMinutes()
  const minutosInicio = HORA_INICIO_GRILLA * 60
  return Math.min(Math.max(minutosDelDia - minutosInicio, 0), TOTAL_MINUTOS_GRILLA)
}

/**
 * Calendario semanal con grilla de horas (como un calendario de verdad, no
 * una lista) — cada asesoría se dibuja como un bloque posicionado en su
 * horario real, con el alto proporcional a su duración. Complementa a
 * `CalendarioMensual` (ese sirve para saltar a una fecha lejana; este es la
 * vista de trabajo del día a día).
 */
export function CalendarioSemanal({
  semana,
  onCambiarSemana,
  data,
  mostrarEmprendimiento,
  onSeleccionar,
}: CalendarioSemanalProps) {
  const [diaMovilSeleccionado, setDiaMovilSeleccionado] = useState(0)
  const inicioSemana = startOfWeek(semana, { weekStartsOn: 1 })
  const dias = Array.from({ length: 7 }, (_, i) => addDays(inicioSemana, i))
  const horas = Array.from({ length: HORA_FIN_GRILLA - HORA_INICIO_GRILLA }, (_, i) => HORA_INICIO_GRILLA + i)

  const asesoriasPorDia = dias.map((dia) => data.filter((a) => isSameDay(fechaAsesoriaComoLocal(a.fechaAsesoria), dia)))

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold capitalize text-primary-900">
          {format(inicioSemana, "d 'de' MMMM", { locale: es })} – {format(addDays(inicioSemana, 6), "d 'de' MMMM yyyy", { locale: es })}
        </p>
        <div className="flex gap-1">
          <Button type="button" variant="outline" size="sm" onClick={() => onCambiarSemana(new Date())}>
            Hoy
          </Button>
          <Button type="button" variant="ghost" size="icon" aria-label="Semana anterior" onClick={() => onCambiarSemana(subWeeks(semana, 1))}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" aria-label="Semana siguiente" onClick={() => onCambiarSemana(addWeeks(semana, 1))}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Selector de día, solo visible en pantallas angostas — la grilla de 7 columnas no cabe en un celular. */}
      <div className="mb-2 flex gap-1 overflow-x-auto sm:hidden">
        {dias.map((dia, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setDiaMovilSeleccionado(i)}
            className={`flex shrink-0 flex-col items-center rounded-lg px-3 py-1.5 text-xs ${
              diaMovilSeleccionado === i ? "bg-primary-700 text-white" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <span className="capitalize">{format(dia, "EEE", { locale: es })}</span>
            <span className={`font-semibold ${isToday(dia) && diaMovilSeleccionado !== i ? "text-primary-700" : ""}`}>
              {format(dia, "d")}
            </span>
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <div className="grid min-w-[640px] grid-cols-[48px_repeat(7,1fr)] sm:min-w-0">
          <div />
          {dias.map((dia, i) => (
            <div
              key={i}
              className={`border-b border-border pb-2 text-center ${i !== diaMovilSeleccionado ? "hidden sm:block" : ""}`}
            >
              <p className="text-xs capitalize text-muted-foreground">{format(dia, "EEE", { locale: es })}</p>
              <p className={`text-sm font-semibold ${isToday(dia) ? "text-primary-700" : "text-foreground"}`}>
                {format(dia, "d")}
              </p>
            </div>
          ))}

          <div className="relative" style={{ height: horas.length * ALTO_HORA_PX }}>
            {horas.map((hora, i) => (
              <div
                key={hora}
                className="absolute right-1 -translate-y-2 text-[11px] text-muted-foreground"
                style={{ top: i * ALTO_HORA_PX }}
              >
                {hora}:00
              </div>
            ))}
          </div>

          {dias.map((_dia, diaIndex) => (
            <div
              key={diaIndex}
              className={`relative border-l border-border ${diaIndex !== diaMovilSeleccionado ? "hidden sm:block" : ""}`}
              style={{ height: horas.length * ALTO_HORA_PX }}
            >
              {horas.map((hora, i) => (
                <div key={hora} className="absolute w-full border-t border-border/60" style={{ top: i * ALTO_HORA_PX }} />
              ))}

              {asesoriasPorDia[diaIndex].map((asesoria) => {
                const inicio = fechaAsesoriaComoLocal(asesoria.fechaAsesoria)
                const top = (minutosDesdeInicioGrilla(inicio) / TOTAL_MINUTOS_GRILLA) * horas.length * ALTO_HORA_PX
                const alto = Math.max((asesoria.duracionMinutos / TOTAL_MINUTOS_GRILLA) * horas.length * ALTO_HORA_PX, 20)

                return (
                  <button
                    key={asesoria.idAsesoria}
                    type="button"
                    onClick={() => onSeleccionar(asesoria)}
                    className={`absolute inset-x-0.5 overflow-hidden rounded-md border px-1.5 py-0.5 text-left text-[11px] leading-tight shadow-sm transition-opacity hover:opacity-90 ${COLOR_POR_ESTADO[asesoria.estadoAsesoria]}`}
                    style={{ top, height: alto }}
                  >
                    <p className="truncate font-medium">
                      {format(inicio, "h:mm a", { locale: es })} · {mostrarEmprendimiento ? asesoria.emprendimiento : asesoria.asesor}
                    </p>
                    {alto > 32 && <p className="truncate opacity-80">{MODALIDAD_LABEL[asesoria.modalidad]}</p>}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
