import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
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
import { nuevoEntregableSchema, type NuevoEntregableFormValues } from "@/domain/entregable/schemas"
import { useCrearEntregableMutation } from "@/domain/entregable/queries"
import { useEmprendimientosQuery } from "@/domain/emprendimiento/queries"
import { FASES } from "@/domain/ruta/catalogo"

/** Registrar un entregable asignado a un emprendimiento y fase. */
export function NuevoEntregableDialog() {
  const [open, setOpen] = useState(false)
  const crearEntregable = useCrearEntregableMutation()
  const emprendimientos = useEmprendimientosQuery({})

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NuevoEntregableFormValues>({ resolver: zodResolver(nuevoEntregableSchema) })

  const onSubmit = async (values: NuevoEntregableFormValues) => {
    try {
      await crearEntregable.mutateAsync({
        idEmprendimiento: Number(values.idEmprendimiento),
        idFase: Number(values.idFase),
        titulo: values.titulo,
        descripcion: values.descripcion,
        fechaPrevista: values.fechaPrevista,
      })
      toast.success("Entregable registrado.")
      reset()
      setOpen(false)
    } catch {
      toast.error("No se pudo registrar el entregable.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Nuevo entregable
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo entregable</DialogTitle>
          <DialogDescription>
            Registre la actividad o entregable que debe realizar el emprendedor.
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

          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="idFase">Fase</Label>
            <Controller
              control={control}
              name="idFase"
              render={({ field }) => (
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <SelectTrigger id="idFase" className="w-full">
                    <SelectValue placeholder="Seleccione la fase" />
                  </SelectTrigger>
                  <SelectContent>
                    {FASES.map((fase) => (
                      <SelectItem key={fase.idFase} value={String(fase.idFase)}>
                        {fase.numero}. {fase.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.idFase && <p className="text-xs text-destructive-700">{errors.idFase.message}</p>}
          </div>

          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="titulo">Título</Label>
            <Input id="titulo" {...register("titulo")} />
            {errors.titulo && <p className="text-xs text-destructive-700">{errors.titulo.message}</p>}
          </div>

          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea id="descripcion" rows={2} {...register("descripcion")} />
            {errors.descripcion && (
              <p className="text-xs text-destructive-700">{errors.descripcion.message}</p>
            )}
          </div>

          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="fechaPrevista">Fecha prevista</Label>
            <Input id="fechaPrevista" type="date" {...register("fechaPrevista")} />
            {errors.fechaPrevista && (
              <p className="text-xs text-destructive-700">{errors.fechaPrevista.message}</p>
            )}
          </div>

          <DialogFooter className="col-span-2">
            <Button type="submit" disabled={crearEntregable.isPending}>
              {crearEntregable.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
