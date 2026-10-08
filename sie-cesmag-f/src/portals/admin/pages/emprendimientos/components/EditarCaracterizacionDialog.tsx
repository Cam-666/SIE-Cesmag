import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { Loader2, Pencil } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TagsInput } from "@/components/shared/TagsInput"
import {
  caracterizacionSchema,
  type CaracterizacionFormValues,
} from "@/domain/emprendimiento/schemas"
import { useEditarCaracterizacionMutation } from "@/domain/emprendimiento/queries"
import { CARACTERIZACION_GRUPOS } from "@/domain/emprendimiento/display"
import type { CaracterizacionEmprendimiento } from "@/domain/emprendimiento/types"

interface EditarCaracterizacionDialogProps {
  idEmprendimiento: number
  valoresActuales: CaracterizacionEmprendimiento
}

/** Edición manual de los datos de caracterización. */
export function EditarCaracterizacionDialog({
  idEmprendimiento,
  valoresActuales,
}: EditarCaracterizacionDialogProps) {
  const [open, setOpen] = useState(false)
  const editar = useEditarCaracterizacionMutation(idEmprendimiento)

  const { register, control, handleSubmit } = useForm<CaracterizacionFormValues>({
    resolver: zodResolver(caracterizacionSchema),
    defaultValues: {
      ...valoresActuales,
      numeroPersonas: valoresActuales.numeroPersonas != null ? String(valoresActuales.numeroPersonas) : "",
    },
  })

  const onSubmit = async (values: CaracterizacionFormValues) => {
    try {
      await editar.mutateAsync({
        ...values,
        numeroPersonas: values.numeroPersonas ? Number(values.numeroPersonas) : null,
      } as CaracterizacionEmprendimiento)
      toast.success("Datos de caracterización actualizados.")
      setOpen(false)
    } catch {
      toast.error("No se pudieron guardar los cambios.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="size-4" />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar datos de caracterización</DialogTitle>
          <DialogDescription>
            Corrija o actualice la información del emprendimiento sin depender del formulario.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto pr-1"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          {CARACTERIZACION_GRUPOS.map((grupo) => (
            <div key={grupo.titulo}>
              <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {grupo.titulo}
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {grupo.campos.map(({ campo, label, tipo }) => (
                  <div key={campo} className="flex flex-col gap-1.5">
                    <Label htmlFor={campo}>{label}</Label>
                    {tipo === "multi" ? (
                      <Controller
                        control={control}
                        name={campo}
                        render={({ field }) => (
                          <TagsInput id={campo} value={field.value} onChange={field.onChange} />
                        )}
                      />
                    ) : (
                      <Input id={campo} type={tipo === "numero" ? "number" : "text"} {...register(campo)} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <DialogFooter className="border-t border-border pt-4">
            <Button type="submit" disabled={editar.isPending}>
              {editar.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Guardar cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
