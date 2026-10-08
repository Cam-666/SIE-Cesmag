import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm, useWatch } from "react-hook-form"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SelectorHorarioAgenda } from "@/components/shared/SelectorHorarioAgenda"
import { SelectorDuracionAsesoria } from "@/components/shared/SelectorDuracionAsesoria"
import { nuevaAsesoriaSchema, type NuevaAsesoriaFormValues } from "@/domain/asesoria/schemas"
import { useCrearAsesoriaMutation } from "@/domain/asesoria/queries"
import { useEmprendimientosQuery } from "@/domain/emprendimiento/queries"
import { useMiAgendaQuery } from "@/domain/agenda/queries"
import { ETAPAS } from "@/domain/ruta/catalogo"

/**
 * Agendar una asesoría (diagnóstica o de seguimiento) dentro de un bloque
 * disponible de la propia agenda. No se pide el avance aquí porque todavía
 * no ha ocurrido; eso se registra después desde el detalle de la asesoría,
 * una vez pasada su fecha.
 */
export function NuevaAsesoriaDialog() {
  const [open, setOpen] = useState(false)
  const crearAsesoria = useCrearAsesoriaMutation()
  const emprendimientos = useEmprendimientosQuery({})
  const miAgenda = useMiAgendaQuery()
  const bloquesDisponibles = miAgenda.data?.filter((b) => b.estado !== "reservado")

  // Refresca la disponibilidad justo al abrir el diálogo: el componente
  // queda montado de fondo mientras el diálogo está cerrado, así que sin
  // esto podía mostrar un bloque como "disponible" aunque ya lo hubieran
  // reservado desde que se cargó la página.
  useEffect(() => {
    if (open) void miAgenda.refetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NuevaAsesoriaFormValues>({
    resolver: zodResolver(nuevaAsesoriaSchema),
    defaultValues: { tipoAsesoria: "seguimiento", modalidad: "virtual" },
  })

  const tipoAsesoria = useWatch({ control, name: "tipoAsesoria" })
  const idAgendaSeleccionado = useWatch({ control, name: "idAgenda" })
  const duracionSeleccionada = useWatch({ control, name: "duracionMinutos" })

  const onSubmit = async (values: NuevaAsesoriaFormValues) => {
    try {
      await crearAsesoria.mutateAsync({
        idEmprendimiento: Number(values.idEmprendimiento),
        idAgenda: Number(values.idAgenda),
        duracionMinutos: values.duracionMinutos,
        tipoAsesoria: values.tipoAsesoria,
        modalidad: values.modalidad,
        etapaIdentificada: values.etapaIdentificada ? Number(values.etapaIdentificada) : null,
      })
      toast.success("Asesoría agendada.")
      reset()
      setOpen(false)
    } catch {
      toast.error("No se pudo agendar la asesoría. Puede que el horario ya no esté disponible.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Nueva asesoría
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Agendar asesoría</DialogTitle>
          <DialogDescription>
            Elija un emprendimiento y un horario de su propia disponibilidad. El resultado de la
            asesoría se registra después, una vez que ocurra.
          </DialogDescription>
        </DialogHeader>

        <form className="grid grid-cols-2 gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="idEmprendimiento">Emprendimiento</Label>
            <Controller
              control={control}
              name="idEmprendimiento"
              render={({ field }) => (
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <SelectTrigger id="idEmprendimiento" className="w-full">
                    <SelectValue placeholder="Seleccione un emprendimiento" />
                  </SelectTrigger>
                  <SelectContent>
                    {emprendimientos.data?.map((e) => (
                      <SelectItem key={e.idEmprendimiento} value={String(e.idEmprendimiento)}>
                        {e.nombreReferencia}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.idEmprendimiento && (
              <p className="text-xs text-destructive-700">{errors.idEmprendimiento.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
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

          <div className="flex flex-col gap-1.5">
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

          {tipoAsesoria === "diagnostica" && (
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="etapaIdentificada">Etapa identificada</Label>
              <Controller
                control={control}
                name="etapaIdentificada"
                render={({ field }) => (
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <SelectTrigger id="etapaIdentificada" className="w-full">
                      <SelectValue placeholder="Seleccione la etapa" />
                    </SelectTrigger>
                    <SelectContent>
                      {ETAPAS.map((etapa) => (
                        <SelectItem key={etapa.idEtapa} value={String(etapa.idEtapa)}>
                          Etapa {etapa.numero} · {etapa.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.etapaIdentificada && (
                <p className="text-xs text-destructive-700">{errors.etapaIdentificada.message}</p>
              )}
            </div>
          )}

          <div className="col-span-2 flex flex-col gap-1.5">
            <Label>Horario disponible (mi agenda)</Label>
            <Controller
              control={control}
              name="idAgenda"
              render={({ field }) => (
                <SelectorHorarioAgenda
                  bloques={bloquesDisponibles}
                  isPending={miAgenda.isPending}
                  isError={miAgenda.isError}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  mensajeVacio='Configure bloques en "Mi disponibilidad" antes de agendar.'
                />
              )}
            />
            {errors.idAgenda && <p className="text-xs text-destructive-700">{errors.idAgenda.message}</p>}
          </div>

          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="duracionMinutos">Duración de la asesoría</Label>
            <Controller
              control={control}
              name="duracionMinutos"
              render={({ field }) => (
                <SelectorDuracionAsesoria
                  bloques={bloquesDisponibles}
                  idAgendaAncla={idAgendaSeleccionado ?? ""}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            {errors.duracionMinutos && (
              <p className="text-xs text-destructive-700">{errors.duracionMinutos.message}</p>
            )}
          </div>

          <DialogFooter className="col-span-2">
            <Button type="submit" disabled={crearAsesoria.isPending || !idAgendaSeleccionado || !duracionSeleccionada}>
              {crearAsesoria.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Agendar asesoría
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
