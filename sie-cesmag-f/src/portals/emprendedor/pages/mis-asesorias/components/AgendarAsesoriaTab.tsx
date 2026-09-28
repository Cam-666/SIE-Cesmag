import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm, useWatch } from "react-hook-form"
import { Loader2 } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { SelectorHorarioAgenda } from "@/components/shared/SelectorHorarioAgenda"
import { agendarAsesoriaSchema, type AgendarAsesoriaFormValues } from "@/domain/asesoria/schemas"
import { useAgendarAsesoriaMutation } from "@/domain/asesoria/queries"
import { useAgendaAsesorQuery } from "@/domain/agenda/queries"

/** Agendar una asesoría dentro de un bloque disponible de cualquier responsable (coordinador, vicerrector o empleado); queda confirmada de inmediato. */
export function AgendarAsesoriaTab() {
  const agenda = useAgendaAsesorQuery()
  const agendar = useAgendarAsesoriaMutation()

  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm<AgendarAsesoriaFormValues>({
    resolver: zodResolver(agendarAsesoriaSchema),
    defaultValues: { tipoAsesoria: "seguimiento" },
  })

  const idAgendaSeleccionado = useWatch({ control, name: "idAgenda" })

  const onSubmit = async (values: AgendarAsesoriaFormValues) => {
    try {
      await agendar.mutateAsync({
        idAgenda: Number(values.idAgenda),
        tipoAsesoria: values.tipoAsesoria,
        motivo: values.motivo,
      })
      toast.success("Asesoría agendada y confirmada.")
      reset({ tipoAsesoria: values.tipoAsesoria })
    } catch {
      toast.error("No se pudo agendar la asesoría. Puede que el horario ya no esté disponible.")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agendar asesoría</CardTitle>
        <p className="text-sm text-muted-foreground">
          Seleccione un horario disponible del coordinador, vicerrector o empleado a cargo. La
          asesoría queda confirmada de inmediato.
        </p>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
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

          <div>
            <Label className="mb-2 block">Horario disponible</Label>
            <Controller
              control={control}
              name="idAgenda"
              render={({ field }) => (
                <SelectorHorarioAgenda
                  bloques={agenda.data}
                  isPending={agenda.isPending}
                  isError={agenda.isError}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  mensajeVacio="Todavía no hay bloques de disponibilidad configurados por el equipo de emprendimiento."
                />
              )}
            />
            {errors.idAgenda && (
              <p className="mt-1 text-xs text-destructive-700">{errors.idAgenda.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="motivo">Motivo u objetivo de la asesoría</Label>
            <Textarea id="motivo" rows={3} {...register("motivo")} />
            {errors.motivo && <p className="text-xs text-destructive-700">{errors.motivo.message}</p>}
          </div>

          <Button type="submit" className="w-fit" disabled={agendar.isPending || !idAgendaSeleccionado}>
            {agendar.isPending && <Loader2 className="size-4 animate-spin" />}
            Solicitar asesoría
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
