import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm, useWatch } from "react-hook-form"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarClock, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { EmptyState } from "@/components/shared/EmptyState"
import { AgendaCalendarioLista } from "@/components/shared/AgendaCalendarioLista"
import { SelectorDuracionAsesoria } from "@/components/shared/SelectorDuracionAsesoria"
import { AsesoriaAccionesDialog } from "@/components/shared/AsesoriaAccionesDialog"
import { agendarAsesoriaSchema, type AgendarAsesoriaFormValues } from "@/domain/asesoria/schemas"
import { useAgendarAsesoriaMutation, useMisAsesoriasQuery } from "@/domain/asesoria/queries"
import { useAgendaAsesorQuery } from "@/domain/agenda/queries"
import { ESTADO_ASESORIA_BADGE } from "@/domain/asesoria/display"
import type { AsesoriaListado } from "@/domain/asesoria/types"
import type { TramoAgenda } from "@/domain/agenda/display"
import type { EstadoAgenda } from "@/domain/agenda/types"
import { fechaAsesoriaComoLocal } from "@/lib/fecha-asesoria"
import { Badge } from "@/components/ui/badge"

const COLOR_POR_ESTADO: Record<EstadoAgenda, string> = {
  disponible: "bg-primary-700/10 border-primary-700/40 text-primary-900",
  bloqueado: "bg-muted border-border text-muted-foreground/60",
  reservado: "bg-muted border-border text-muted-foreground/60",
}

/** Horas de inicio cada 15 min dentro de un tramo disponible — la granularidad real de AGENDA. */
function horasDeInicio(tramo: TramoAgenda): string[] {
  const resultado: string[] = []
  let actual = tramo.horaInicio
  while (actual < tramo.horaFin) {
    resultado.push(actual)
    const [h, m] = actual.split(":").map(Number)
    const total = h * 60 + m + 15
    actual = `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`
  }
  return resultado
}

/** Agendar una asesoría dentro de un bloque disponible de cualquier responsable (coordinador, vicerrector o administrativo); queda confirmada de inmediato. */
export function AgendarAsesoriaTab() {
  const agenda = useAgendaAsesorQuery()
  const misAsesorias = useMisAsesoriasQuery()
  const agendar = useAgendarAsesoriaMutation()

  const [tramoElegido, setTramoElegido] = useState<TramoAgenda | null>(null)
  const [asesoriaDetalle, setAsesoriaDetalle] = useState<AsesoriaListado | null>(null)

  const {
    control,
    handleSubmit,
    register,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AgendarAsesoriaFormValues>({
    resolver: zodResolver(agendarAsesoriaSchema),
    defaultValues: { tipoAsesoria: "seguimiento", modalidad: "virtual" },
  })

  const idAgendaSeleccionado = useWatch({ control, name: "idAgenda" })
  const duracionSeleccionada = useWatch({ control, name: "duracionMinutos" })

  const asesoriaPendiente = misAsesorias.data?.find((a) => a.estadoAsesoria === "programada")

  const onElegirHoraInicio = (tramo: TramoAgenda, horaInicio: string) => {
    const bloque = agenda.data?.find(
      (b) => b.idUsuario === tramo.idUsuario && b.fecha === tramo.fecha && b.horaInicio === horaInicio,
    )
    if (!bloque) return
    setValue("idAgenda", String(bloque.idAgenda), { shouldValidate: true })
    setValue("duracionMinutos", undefined as unknown as AgendarAsesoriaFormValues["duracionMinutos"])
  }

  const onSubmit = async (values: AgendarAsesoriaFormValues) => {
    try {
      await agendar.mutateAsync({
        idAgenda: Number(values.idAgenda),
        duracionMinutos: values.duracionMinutos,
        tipoAsesoria: values.tipoAsesoria,
        modalidad: values.modalidad,
        motivo: values.motivo,
      })
      toast.success("Asesoría agendada y confirmada.")
      reset({ tipoAsesoria: values.tipoAsesoria, modalidad: values.modalidad })
      setTramoElegido(null)
    } catch {
      toast.error("No se pudo agendar la asesoría. Puede que el horario ya no esté disponible.")
    }
  }

  if (misAsesorias.isPending) {
    return <Skeleton className="h-64 w-full" />
  }

  if (asesoriaPendiente) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState
            icon={CalendarClock}
            title="Ya tiene una asesoría programada"
            description={`Tiene una asesoría con ${asesoriaPendiente.asesor} el ${format(fechaAsesoriaComoLocal(asesoriaPendiente.fechaAsesoria), "d 'de' MMMM, h:mm a", { locale: es })} pendiente de resultado. Podrá agendar otra cuando el asesor la registre, o si la cancela desde "Mis asesorías".`}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Agendar asesoría</CardTitle>
        <p className="text-sm text-muted-foreground">
          Elija un bloque disponible del coordinador, vicerrector o administrativo a cargo, luego la
          hora de inicio y la duración. La asesoría queda confirmada de inmediato.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full border bg-primary-700/10 border-primary-700/40" />
            Disponible
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full border bg-muted border-border" />
            No disponible
          </span>
        </div>

        {agenda.isPending && <Skeleton className="h-64 w-full" />}
        {agenda.isError && (
          <EmptyState icon={CalendarClock} title="No se pudieron cargar los horarios" />
        )}

        {!agenda.isPending && !agenda.isError && (
          <AgendaCalendarioLista
            bloques={(agenda.data ?? []).filter((b) => b.estado === "disponible")}
            colorPorEstado={COLOR_POR_ESTADO}
            tramoResaltadoId={tramoElegido?.ids[0]}
            onSeleccionarTramo={setTramoElegido}
            fechasExtra={new Set(misAsesorias.data?.map((a) => a.fechaAsesoria.slice(0, 10)))}
            contenidoVacio={(fecha) => {
              const asesoriaDelDia = misAsesorias.data?.find((a) => a.fechaAsesoria.slice(0, 10) === fecha)
              if (asesoriaDelDia) {
                return (
                  <button
                    type="button"
                    onClick={() => setAsesoriaDetalle(asesoriaDelDia)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 text-left text-sm hover:bg-muted"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-foreground">
                        {format(fechaAsesoriaComoLocal(asesoriaDelDia.fechaAsesoria), "h:mm a", { locale: es })} ·{" "}
                        {asesoriaDelDia.asesor}
                      </span>
                      <span className="text-xs text-muted-foreground">Toque para ver el detalle.</span>
                    </span>
                    <Badge variant={ESTADO_ASESORIA_BADGE[asesoriaDelDia.estadoAsesoria].variant}>
                      {ESTADO_ASESORIA_BADGE[asesoriaDelDia.estadoAsesoria].label}
                    </Badge>
                  </button>
                )
              }
              return (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-10 text-center">
                  <CalendarClock className="size-5 text-muted-foreground/60" />
                  <p className="text-sm text-muted-foreground">Sin bloques ni asesorías este día.</p>
                </div>
              )
            }}
          />
        )}

        {tramoElegido && (
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-3">
            <div>
              <p className="text-sm font-medium text-foreground capitalize">
                {format(parseISO(tramoElegido.fecha), "EEEE d 'de' MMMM", { locale: es })} con{" "}
                {tramoElegido.asesorNombre}
              </p>
              <p className="text-xs text-muted-foreground">Elija la hora de inicio dentro de este bloque.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {horasDeInicio(tramoElegido).map((hora) => {
                const bloque = agenda.data?.find(
                  (b) => b.idUsuario === tramoElegido.idUsuario && b.fecha === tramoElegido.fecha && b.horaInicio === hora,
                )
                const seleccionado = idAgendaSeleccionado === String(bloque?.idAgenda)
                return (
                  <button
                    key={hora}
                    type="button"
                    onClick={() => onElegirHoraInicio(tramoElegido, hora)}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                      seleccionado
                        ? "border-primary-700 bg-primary-700 text-white"
                        : "border-border text-foreground hover:bg-muted"
                    }`}
                  >
                    {hora}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          {errors.idAgenda && !idAgendaSeleccionado && (
            <p className="text-xs text-destructive-700">{errors.idAgenda.message}</p>
          )}

          {idAgendaSeleccionado && (
            <div className="flex flex-col gap-1.5 sm:w-64">
              <Label htmlFor="duracionMinutos">Duración de la asesoría</Label>
              <Controller
                control={control}
                name="duracionMinutos"
                render={({ field }) => (
                  <SelectorDuracionAsesoria
                    bloques={agenda.data}
                    idAgendaAncla={idAgendaSeleccionado}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.duracionMinutos && (
                <p className="text-xs text-destructive-700">{errors.duracionMinutos.message}</p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1.5 sm:w-64">
            <Label htmlFor="tipoAsesoria">Tipo de asesoría</Label>
            <Controller
              control={control}
              name="tipoAsesoria"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="tipoAsesoria" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diagnostica">Diagnóstica</SelectItem>
                    <SelectItem value="seguimiento">Seguimiento</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:w-64">
            <Label htmlFor="modalidad">Modalidad</Label>
            <Controller
              control={control}
              name="modalidad"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="modalidad" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="presencial">Presencial</SelectItem>
                    <SelectItem value="virtual">Virtual</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="motivo">Motivo u objetivo de la asesoría</Label>
            <Textarea id="motivo" rows={3} {...register("motivo")} />
            {errors.motivo && <p className="text-xs text-destructive-700">{errors.motivo.message}</p>}
          </div>

          <Button
            type="submit"
            className="w-fit"
            disabled={agendar.isPending || !idAgendaSeleccionado || !duracionSeleccionada}
          >
            {agendar.isPending && <Loader2 className="size-4 animate-spin" />}
            Solicitar asesoría
          </Button>
        </form>
      </CardContent>
    </Card>
    <AsesoriaAccionesDialog asesoria={asesoriaDetalle} onOpenChange={(open) => !open && setAsesoriaDetalle(null)} />
    </>
  )
}
