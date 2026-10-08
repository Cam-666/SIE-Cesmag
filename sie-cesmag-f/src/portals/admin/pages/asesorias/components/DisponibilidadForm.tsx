import { useState } from "react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { Loader2, Lock, Plus, Trash2, Unlock, X } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { AgendaCalendarioLista } from "@/components/shared/AgendaCalendarioLista"
import {
  useCambiarEstadoBloqueAgendaMutation,
  useCrearBloqueAgendaMutation,
  useEliminarBloqueAgendaMutation,
  useMiAgendaQuery,
} from "@/domain/agenda/queries"
import { ESTADO_AGENDA_BADGE } from "@/domain/agenda/display"
import type { TramoAgenda } from "@/domain/agenda/display"
import type { EstadoAgenda } from "@/domain/agenda/types"
import { usePermiso } from "@/hooks/usePermiso"
import { rangoPermitidoDisponibilidad } from "@/lib/fecha-asesoria"

const COLOR_POR_ESTADO: Record<EstadoAgenda, string> = {
  disponible: "bg-primary-700/10 border-primary-700/40 text-primary-900",
  bloqueado: "bg-muted border-border text-muted-foreground",
  reservado: "bg-destructive-600/10 border-destructive-600/40 text-destructive-700",
}

/** Bloques de disponibilidad con fecha concreta (coincide con la entidad AGENDA del ER), como una agenda semanal. */
export function DisponibilidadForm() {
  const agenda = useMiAgendaQuery()
  const crear = useCrearBloqueAgendaMutation()
  const eliminar = useEliminarBloqueAgendaMutation()
  const cambiarEstado = useCambiarEstadoBloqueAgendaMutation()
  const puedeAnadir = usePermiso("asesorias", "anadir")
  const puedeEditar = usePermiso("asesorias", "editar")
  const puedeEliminar = usePermiso("asesorias", "eliminar")

  const [tramoSeleccionado, setTramoSeleccionado] = useState<TramoAgenda | null>(null)
  const [nuevo, setNuevo] = useState({ fecha: "", horaInicio: "09:00", horaFin: "10:00" })
  const { desde: fechaMinima, hasta: fechaMaxima } = rangoPermitidoDisponibilidad()
  const nuevoValido =
    !!nuevo.fecha && nuevo.horaInicio < nuevo.horaFin && nuevo.fecha >= fechaMinima && nuevo.fecha <= fechaMaxima

  const onAgregar = async () => {
    try {
      await crear.mutateAsync(nuevo)
      toast.success(
        "Disponibilidad agregada. El emprendedor podrá elegir la duración de cada asesoría (15 a 60 min) al agendar.",
      )
      setNuevo({ fecha: "", horaInicio: "09:00", horaFin: "10:00" })
    } catch {
      toast.error("No se pudo agregar el bloque. Revise que la hora de fin sea posterior a la de inicio.")
    }
  }

  const onCambiarEstadoTramo = async (tramo: TramoAgenda, estado: Extract<EstadoAgenda, "disponible" | "bloqueado">) => {
    try {
      await Promise.all(tramo.ids.map((idAgenda) => cambiarEstado.mutateAsync({ idAgenda, estado })))
      setTramoSeleccionado(null)
    } catch {
      toast.error("No se pudo actualizar el bloque.")
    }
  }

  const onEliminarTramo = async (tramo: TramoAgenda) => {
    try {
      await Promise.all(tramo.ids.map((idAgenda) => eliminar.mutateAsync(idAgenda)))
      toast.success("Bloque eliminado.")
      setTramoSeleccionado(null)
    } catch {
      toast.error("No se pudo eliminar el bloque.")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mi disponibilidad</CardTitle>
        <p className="text-sm text-muted-foreground">
          Defina el rango de fecha y hora en que puede recibir emprendedores — p. ej. de 8:00 a
          12:00. Quien agende elegirá la hora de inicio y la duración de su asesoría (15 a 60 min)
          dentro de ese rango, en vez de reservarlo completo de una sola vez. Toque un bloque del
          calendario para gestionarlo. Solo se puede configurar disponibilidad para el mes actual
          (desde el día 20, también para el siguiente).
        </p>
      </CardHeader>
      <CardContent className="gap-4">
        {puedeAnadir && (
          <div className="flex flex-wrap items-end gap-3 rounded-lg border border-dashed border-border p-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nuevo-fecha">Fecha</Label>
              <Input
                id="nuevo-fecha"
                type="date"
                min={fechaMinima}
                max={fechaMaxima}
                value={nuevo.fecha}
                onChange={(e) => setNuevo((v) => ({ ...v, fecha: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nuevo-inicio">Hora inicio</Label>
              <Input
                id="nuevo-inicio"
                type="time"
                value={nuevo.horaInicio}
                onChange={(e) => setNuevo((v) => ({ ...v, horaInicio: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nuevo-fin">Hora fin</Label>
              <Input
                id="nuevo-fin"
                type="time"
                value={nuevo.horaFin}
                onChange={(e) => setNuevo((v) => ({ ...v, horaFin: e.target.value }))}
              />
            </div>
            <Button type="button" onClick={onAgregar} disabled={!nuevoValido || crear.isPending}>
              {crear.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Agregar bloque
            </Button>
            {nuevo.fecha && nuevo.horaInicio >= nuevo.horaFin && (
              <p className="w-full text-xs text-destructive-700">La hora de inicio debe ser anterior a la de fin.</p>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          {(Object.keys(COLOR_POR_ESTADO) as EstadoAgenda[]).map((estado) => (
            <span key={estado} className="flex items-center gap-1.5">
              <span className={`size-2.5 rounded-full border ${COLOR_POR_ESTADO[estado]}`} />
              {ESTADO_AGENDA_BADGE[estado].label}
            </span>
          ))}
        </div>

        {agenda.isPending && <Skeleton className="h-64 w-full" />}

        {!agenda.isPending && (
          <AgendaCalendarioLista
            bloques={agenda.data ?? []}
            colorPorEstado={COLOR_POR_ESTADO}
            tramoResaltadoId={tramoSeleccionado?.ids[0]}
            onSeleccionarTramo={setTramoSeleccionado}
          />
        )}

        {tramoSeleccionado && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 p-3">
            <div className="text-sm">
              <p className="font-medium text-foreground capitalize">
                {format(parseISO(tramoSeleccionado.fecha), "EEEE d 'de' MMMM", { locale: es })}
              </p>
              <p className="text-muted-foreground">
                {tramoSeleccionado.horaInicio} – {tramoSeleccionado.horaFin} ·{" "}
                <Badge variant={ESTADO_AGENDA_BADGE[tramoSeleccionado.estado].variant}>
                  {ESTADO_AGENDA_BADGE[tramoSeleccionado.estado].label}
                </Badge>
                {tramoSeleccionado.estado === "reservado" && tramoSeleccionado.emprendimiento && (
                  <> · {tramoSeleccionado.emprendimiento}</>
                )}
              </p>
              {tramoSeleccionado.estado === "reservado" && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Ya está agendado — consulte el detalle completo desde "Asesorías" o "Mi calendario".
                </p>
              )}
            </div>
            <div className="flex items-center gap-1">
              {puedeEditar && tramoSeleccionado.estado !== "reservado" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={cambiarEstado.isPending}
                  onClick={() =>
                    onCambiarEstadoTramo(
                      tramoSeleccionado,
                      tramoSeleccionado.estado === "disponible" ? "bloqueado" : "disponible",
                    )
                  }
                >
                  {tramoSeleccionado.estado === "disponible" ? (
                    <Lock className="size-4" />
                  ) : (
                    <Unlock className="size-4" />
                  )}
                  {tramoSeleccionado.estado === "disponible" ? "Bloquear" : "Desbloquear"}
                </Button>
              )}
              {puedeEliminar && tramoSeleccionado.estado !== "reservado" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-destructive-700"
                  disabled={eliminar.isPending}
                  onClick={() => onEliminarTramo(tramoSeleccionado)}
                >
                  <Trash2 className="size-4" />
                  Eliminar
                </Button>
              )}
              <Button type="button" variant="ghost" size="icon" aria-label="Cerrar" onClick={() => setTramoSeleccionado(null)}>
                <X className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
