import { useState } from "react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarClock, Loader2, Lock, Plus, Trash2, Unlock } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmptyState } from "@/components/shared/EmptyState"
import {
  useCambiarEstadoBloqueAgendaMutation,
  useCrearBloqueAgendaMutation,
  useEliminarBloqueAgendaMutation,
  useMiAgendaQuery,
} from "@/domain/agenda/queries"
import { ESTADO_AGENDA_BADGE } from "@/domain/agenda/display"
import { usePermiso } from "@/hooks/usePermiso"

/** Bloques de disponibilidad con fecha concreta (coincide con la entidad AGENDA del ER). */
export function DisponibilidadForm() {
  const agenda = useMiAgendaQuery()
  const crear = useCrearBloqueAgendaMutation()
  const eliminar = useEliminarBloqueAgendaMutation()
  const cambiarEstado = useCambiarEstadoBloqueAgendaMutation()
  const puedeAnadir = usePermiso("asesorias", "anadir")
  const puedeEditar = usePermiso("asesorias", "editar")
  const puedeEliminar = usePermiso("asesorias", "eliminar")

  const [nuevo, setNuevo] = useState({ fecha: "", horaInicio: "09:00", horaFin: "10:00" })
  const nuevoValido = !!nuevo.fecha && nuevo.horaInicio < nuevo.horaFin

  const onAgregar = async () => {
    try {
      await crear.mutateAsync(nuevo)
      toast.success("Bloque agregado a su disponibilidad.")
      setNuevo({ fecha: "", horaInicio: "09:00", horaFin: "10:00" })
    } catch {
      toast.error("No se pudo agregar el bloque.")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mi disponibilidad</CardTitle>
        <p className="text-sm text-muted-foreground">
          Defina los bloques de fecha y hora en que puede recibir emprendedores. El emprendedor
          solo podrá agendar dentro de los que estén "Disponible".
        </p>
      </CardHeader>
      <CardContent className="gap-4">
        {agenda.isPending && <Skeleton className="h-32 w-full" />}

        {!agenda.isPending && agenda.data?.length === 0 && (
          <EmptyState
            icon={CalendarClock}
            title="Sin bloques de disponibilidad"
            description="Agregue al menos un bloque con fecha, hora de inicio y hora de fin."
          />
        )}

        {!agenda.isPending && agenda.data && agenda.data.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Hora inicio</TableHead>
                  <TableHead>Hora fin</TableHead>
                  <TableHead>Estado</TableHead>
                  {(puedeEditar || puedeEliminar) && <TableHead className="text-right">Acción</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {agenda.data.map((bloque) => (
                  <TableRow key={bloque.idAgenda}>
                    <TableCell className="text-sm text-foreground capitalize">
                      {format(parseISO(bloque.fecha), "d 'de' MMMM 'de' yyyy", { locale: es })}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{bloque.horaInicio}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{bloque.horaFin}</TableCell>
                    <TableCell>
                      <Badge variant={ESTADO_AGENDA_BADGE[bloque.estado].variant}>
                        {ESTADO_AGENDA_BADGE[bloque.estado].label}
                      </Badge>
                      {bloque.estado === "reservado" && bloque.emprendimiento && (
                        <span className="ml-2 text-xs text-muted-foreground">{bloque.emprendimiento}</span>
                      )}
                    </TableCell>
                    {(puedeEditar || puedeEliminar) && (
                      <TableCell className="text-right">
                        {bloque.estado !== "reservado" && (
                          <div className="flex justify-end gap-1">
                            {puedeEditar && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label={bloque.estado === "disponible" ? "Bloquear" : "Desbloquear"}
                                title={bloque.estado === "disponible" ? "Marcar como no disponible" : "Marcar como disponible"}
                                disabled={cambiarEstado.isPending}
                                onClick={() =>
                                  cambiarEstado.mutate({
                                    idAgenda: bloque.idAgenda,
                                    estado: bloque.estado === "disponible" ? "bloqueado" : "disponible",
                                  })
                                }
                              >
                                {bloque.estado === "disponible" ? (
                                  <Lock className="size-4" />
                                ) : (
                                  <Unlock className="size-4" />
                                )}
                              </Button>
                            )}
                            {puedeEliminar && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-destructive-700"
                                aria-label="Eliminar bloque"
                                disabled={eliminar.isPending}
                                onClick={() =>
                                  eliminar.mutate(bloque.idAgenda, {
                                    onSuccess: () => toast.success("Bloque eliminado."),
                                    onError: () => toast.error("No se pudo eliminar el bloque."),
                                  })
                                }
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {puedeAnadir && (
          <div className="flex flex-wrap items-end gap-3 rounded-lg border border-dashed border-border p-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nuevo-fecha">Fecha</Label>
              <Input
                id="nuevo-fecha"
                type="date"
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
      </CardContent>
    </Card>
  )
}
