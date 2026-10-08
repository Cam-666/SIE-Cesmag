import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { minutosDisponiblesDesde } from "@/domain/agenda/display"
import type { Agenda } from "@/domain/agenda/types"
import { DURACIONES_ASESORIA_MINUTOS, type DuracionAsesoriaMinutos } from "@/domain/asesoria/types"

interface SelectorDuracionAsesoriaProps {
  bloques: Agenda[] | undefined
  /** Bloque elegido como hora de inicio; sin esto no hay nada que ofrecer. */
  idAgendaAncla: string
  value: DuracionAsesoriaMinutos | undefined
  onChange: (duracionMinutos: DuracionAsesoriaMinutos) => void
}

/**
 * Una vez elegida la hora de inicio, ofrece solo las duraciones que
 * realmente caben antes de topar con un bloque ya reservado, bloqueado o el
 * fin del rango de disponibilidad — nunca más de 1 hora. Así, de una
 * disponibilidad de 8:00 a 12:00, agendar a las 9:00 solo deja elegir entre
 * las duraciones que no choquen con otra asesoría ya agendada más adelante.
 */
export function SelectorDuracionAsesoria({ bloques, idAgendaAncla, value, onChange }: SelectorDuracionAsesoriaProps) {
  const ancla = bloques?.find((b) => String(b.idAgenda) === idAgendaAncla)
  const minutosDisponibles = ancla && bloques ? minutosDisponiblesDesde(bloques, ancla) : 0
  const opciones = DURACIONES_ASESORIA_MINUTOS.filter((d) => d <= minutosDisponibles)

  return (
    <Select
      value={value ? String(value) : ""}
      onValueChange={(v) => onChange(Number(v) as DuracionAsesoriaMinutos)}
      disabled={!ancla || opciones.length === 0}
    >
      <SelectTrigger id="duracionMinutos" className="w-full">
        <SelectValue placeholder={ancla ? "Seleccione la duración" : "Primero elija un horario"} />
      </SelectTrigger>
      <SelectContent>
        {opciones.map((d) => (
          <SelectItem key={d} value={String(d)}>
            {d} minutos
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
