import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm, useWatch } from "react-hook-form"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cambioEstadoSchema, reingresoSchema, type CambioEstadoFormValues, type ReingresoFormValues } from "@/domain/emprendimiento/schemas"
import type { EstadoEmprendimiento } from "@/domain/emprendimiento/types"
import { useCambiarEstadoMutation, useRegistrarReingresoMutation } from "@/domain/emprendimiento/queries"

interface GestionEstadoDialogProps {
  idEmprendimiento: number
  estadoActual: EstadoEmprendimiento
}

/** Cambio de estado del emprendimiento y registro de reingreso. */
export function GestionEstadoDialog({ idEmprendimiento, estadoActual }: GestionEstadoDialogProps) {
  const [open, setOpen] = useState(false)
  const cambiarEstado = useCambiarEstadoMutation(idEmprendimiento)
  const registrarReingreso = useRegistrarReingresoMutation(idEmprendimiento)

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CambioEstadoFormValues>({
    resolver: zodResolver(cambioEstadoSchema),
    defaultValues: { estadoNuevo: estadoActual, motivo: "" },
  })

  const reingresoForm = useForm<ReingresoFormValues>({
    resolver: zodResolver(reingresoSchema),
    defaultValues: { fechaReingreso: format(new Date(), "yyyy-MM-dd") },
  })

  const estadoSeleccionado = useWatch({ control, name: "estadoNuevo" })

  const onSubmit = async (values: CambioEstadoFormValues) => {
    try {
      await cambiarEstado.mutateAsync({
        idEmprendimiento,
        estadoNuevo: values.estadoNuevo,
        fechaCambio: new Date().toISOString(),
        motivo: values.motivo?.trim() || null,
      })
      toast.success("Estado del emprendimiento actualizado.")
      reset(values)
      setOpen(false)
    } catch {
      toast.error("No se pudo actualizar el estado. Intente nuevamente.")
    }
  }

  const onReingreso = async (values: ReingresoFormValues) => {
    try {
      await registrarReingreso.mutateAsync({ idEmprendimiento, fechaReingreso: values.fechaReingreso })
      toast.success("Reingreso registrado. Recuerde agendar una nueva asesoría diagnóstica.")
      setOpen(false)
    } catch {
      toast.error("No se pudo registrar el reingreso.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Gestionar estado
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gestión del estado</DialogTitle>
          <DialogDescription>Actualice el estado general del emprendimiento.</DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="estadoNuevo">Nuevo estado</Label>
              <Controller
                control={control}
                name="estadoNuevo"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="estadoNuevo" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="inactivo">Inactivo</SelectItem>
                      <SelectItem value="terminado">Terminado</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fechaCambio">Fecha del cambio</Label>
              <Input id="fechaCambio" value={format(new Date(), "dd/MM/yyyy")} disabled />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="motivo">
              Motivo {estadoSeleccionado !== "activo" && <span className="text-destructive-700">*</span>}
            </Label>
            <Textarea id="motivo" rows={3} {...register("motivo")} />
            {errors.motivo && <p className="text-xs text-destructive-700">{errors.motivo.message}</p>}
          </div>

          {estadoSeleccionado === "inactivo" && (
            <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
              Al registrar Inactivo se conserva el historial y el emprendimiento podrá reingresar
              posteriormente.
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={cambiarEstado.isPending}>
              {cambiarEstado.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Guardar cambio
            </Button>
          </DialogFooter>
        </form>

        {estadoActual === "inactivo" && (
          <div className="mt-2 border-t border-border pt-4">
            <p className="mb-1 text-sm font-medium text-foreground">Reingreso al proceso</p>
            <p className="mb-3 text-xs text-muted-foreground">
              Disponible porque el estado actual es Inactivo. Después del reingreso se registra una
              nueva asesoría diagnóstica para determinar la situación y etapa actual.
            </p>
            <form
              className="flex items-end gap-2"
              onSubmit={reingresoForm.handleSubmit(onReingreso)}
              noValidate
            >
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor="fechaReingreso">Fecha de reingreso</Label>
                <Input
                  id="fechaReingreso"
                  type="date"
                  {...reingresoForm.register("fechaReingreso")}
                />
              </div>
              <Button type="submit" variant="outline" disabled={registrarReingreso.isPending}>
                {registrarReingreso.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Registrar reingreso
              </Button>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
