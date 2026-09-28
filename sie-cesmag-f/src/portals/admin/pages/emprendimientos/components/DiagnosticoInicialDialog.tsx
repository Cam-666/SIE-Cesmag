import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useRegistrarDiagnosticoInicialMutation } from "@/domain/emprendimiento/queries"
import { ETAPAS } from "@/domain/ruta/catalogo"

const diagnosticoSchema = z.object({
  situacionActual: z.string().min(1, "Describa la situación actual del emprendimiento."),
  idEtapaIngreso: z.string().min(1, "Seleccione la etapa de ingreso."),
})

type DiagnosticoFormValues = z.infer<typeof diagnosticoSchema>

/**
 * El diagnóstico inicial y la etapa de ingreso se registran juntos porque
 * el diagnóstico se realiza durante la primera asesoría y de él se
 * desprende la etapa en la que continúa el emprendimiento.
 */
export function DiagnosticoInicialDialog({ idEmprendimiento }: { idEmprendimiento: number }) {
  const registrar = useRegistrarDiagnosticoInicialMutation()

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DiagnosticoFormValues>({ resolver: zodResolver(diagnosticoSchema) })

  const onSubmit = async (values: DiagnosticoFormValues) => {
    try {
      await registrar.mutateAsync({
        idEmprendimiento,
        situacionActual: values.situacionActual,
        idEtapaIngreso: Number(values.idEtapaIngreso),
      })
      toast.success("Diagnóstico inicial registrado. El emprendimiento ya tiene etapa asignada.")
    } catch {
      toast.error("No se pudo registrar el diagnóstico inicial.")
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="situacionActual">Situación actual del emprendimiento</Label>
        <Textarea
          id="situacionActual"
          rows={3}
          placeholder="Estado actual, necesidades identificadas y conocimientos previos sobre validación temprana."
          {...register("situacionActual")}
        />
        {errors.situacionActual && (
          <p className="text-xs text-destructive-700">{errors.situacionActual.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="idEtapaIngreso">Etapa de ingreso</Label>
        <Controller
          control={control}
          name="idEtapaIngreso"
          render={({ field }) => (
            <Select value={field.value ?? ""} onValueChange={field.onChange}>
              <SelectTrigger id="idEtapaIngreso" className="w-full">
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
        {errors.idEtapaIngreso && (
          <p className="text-xs text-destructive-700">{errors.idEtapaIngreso.message}</p>
        )}
      </div>

      <Button type="submit" className="w-fit" disabled={registrar.isPending}>
        {registrar.isPending && <Loader2 className="size-4 animate-spin" />}
        Registrar diagnóstico y definir etapa
      </Button>
    </form>
  )
}
