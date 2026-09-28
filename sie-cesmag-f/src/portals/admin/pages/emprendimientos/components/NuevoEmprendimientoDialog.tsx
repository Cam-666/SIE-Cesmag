import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"
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
  crearEmprendimientoSchema,
  type CrearEmprendimientoFormValues,
} from "@/domain/emprendimiento/schemas"
import { useCrearEmprendimientoMutation } from "@/domain/emprendimiento/queries"

/**
 * Registrar un emprendimiento directamente desde el panel admin, sin pasar
 * por la aprobación de un precandidato: por ejemplo, para alguien que ya
 * tiene cuenta (respondió el formulario con interés a futuro, sin negocio
 * todavía) y ahora sí quiere registrar uno.
 */
export function NuevoEmprendimientoDialog() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const crearEmprendimiento = useCrearEmprendimientoMutation()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CrearEmprendimientoFormValues>({ resolver: zodResolver(crearEmprendimientoSchema) })

  const onSubmit = async (values: CrearEmprendimientoFormValues) => {
    try {
      const resultado = await crearEmprendimiento.mutateAsync(values)
      toast.success("Emprendimiento creado.")
      reset()
      setOpen(false)
      navigate(`/admin/emprendimientos/${resultado.idEmprendimiento}`)
    } catch {
      toast.error("No se pudo crear el emprendimiento.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Nuevo emprendimiento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Nuevo emprendimiento</DialogTitle>
          <DialogDescription>
            Si la persona no tiene cuenta todavía, se creará y definirá su contraseña desde el
            enlace de acceso.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nombreReferencia">Nombre del emprendimiento</Label>
            <Input id="nombreReferencia" {...register("nombreReferencia")} />
            {errors.nombreReferencia && (
              <p className="text-xs text-destructive-700">{errors.nombreReferencia.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="numeroIdentificacion">Número de identificación del fundador</Label>
            <Input id="numeroIdentificacion" {...register("numeroIdentificacion")} />
            {errors.numeroIdentificacion && (
              <p className="text-xs text-destructive-700">{errors.numeroIdentificacion.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nombre">Nombre del fundador</Label>
            <Input id="nombre" {...register("nombre")} />
            {errors.nombre && <p className="text-xs text-destructive-700">{errors.nombre.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="correo">Correo del fundador</Label>
            <Input id="correo" type="email" {...register("correo")} />
            {errors.correo && <p className="text-xs text-destructive-700">{errors.correo.message}</p>}
          </div>
          <p className="text-xs text-muted-foreground">
            Si ya existe alguien con ese número de identificación, se usan sus datos y se ignoran
            el nombre y el correo escritos aquí.
          </p>
          <DialogFooter>
            <Button type="submit" disabled={crearEmprendimiento.isPending}>
              {crearEmprendimiento.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Crear
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
