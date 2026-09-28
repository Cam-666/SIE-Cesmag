import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { Loader2, UserCog } from "lucide-react"
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
import {
  asignarResponsableSchema,
  type AsignarResponsableFormValues,
} from "@/domain/usuario/schemas"
import { useAsignarResponsableMutation, useUsuariosQuery } from "@/domain/usuario/queries"
import type { Etapa } from "@/domain/ruta/types"

interface AsignarResponsableDialogProps {
  etapa: Etapa
  idUsuarioActual: string | null
}

/** Asignar un usuario administrativo como responsable de una etapa. */
export function AsignarResponsableDialog({ etapa, idUsuarioActual }: AsignarResponsableDialogProps) {
  const [open, setOpen] = useState(false)
  const asignar = useAsignarResponsableMutation()
  const usuarios = useUsuariosQuery()

  const { control, handleSubmit, formState: { errors } } = useForm<AsignarResponsableFormValues>({
    resolver: zodResolver(asignarResponsableSchema),
    defaultValues: { idUsuario: idUsuarioActual ? String(idUsuarioActual) : "" },
  })

  const onSubmit = async (values: AsignarResponsableFormValues) => {
    try {
      await asignar.mutateAsync({ idEtapa: etapa.idEtapa, idUsuario: values.idUsuario })
      toast.success("Responsable asignado.")
      setOpen(false)
    } catch {
      toast.error("No se pudo asignar el responsable.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserCog className="size-4" />
          {idUsuarioActual ? "Cambiar" : "Asignar"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Responsable de la etapa</DialogTitle>
          <DialogDescription>
            Etapa {etapa.numero} · {etapa.nombre}
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="idUsuario">Usuario responsable</Label>
            <Controller
              control={control}
              name="idUsuario"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="idUsuario" className="w-full">
                    <SelectValue placeholder="Seleccione un usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    {usuarios.data
                      ?.filter((u) => u.activo)
                      .map((u) => (
                        <SelectItem key={u.idUsuario} value={String(u.idUsuario)}>
                          {u.nombre}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.idUsuario && <p className="text-xs text-destructive-700">{errors.idUsuario.message}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={asignar.isPending}>
              {asignar.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
