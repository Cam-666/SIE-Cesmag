import { useState } from "react"
import { isAxiosError } from "axios"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Loader2, UserPlus } from "lucide-react"
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
  agregarIntegranteSchema,
  type AgregarIntegranteFormValues,
} from "@/domain/emprendimiento/schemas"
import { useAgregarIntegranteMutation } from "@/domain/emprendimiento/queries"

/**
 * Registrar que otro estudiante o egresado hace parte del emprendimiento.
 * Primero solo pide el número de identificación: si la persona ya existe
 * (llenó la encuesta como precandidato, o ya tiene cuenta de otro
 * emprendimiento) queda vinculada de una vez. Si el backend responde 404
 * ("no existe nadie con esa identificación"), recién ahí se revelan los
 * campos de nombre y correo para crearla desde cero.
 */
export function AgregarIntegranteDialog({ idEmprendimiento }: { idEmprendimiento: number }) {
  const [open, setOpen] = useState(false)
  const [esPersonaNueva, setEsPersonaNueva] = useState(false)
  const agregarIntegrante = useAgregarIntegranteMutation(idEmprendimiento)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AgregarIntegranteFormValues>({ resolver: zodResolver(agregarIntegranteSchema) })

  const alAbrirCambiar = (siguienteAbierto: boolean) => {
    setOpen(siguienteAbierto)
    if (!siguienteAbierto) {
      reset()
      setEsPersonaNueva(false)
    }
  }

  const onSubmit = async (values: AgregarIntegranteFormValues) => {
    try {
      await agregarIntegrante.mutateAsync(values)
      toast.success("Integrante agregado al emprendimiento.")
      alAbrirCambiar(false)
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404 && !esPersonaNueva) {
        setEsPersonaNueva(true)
        toast.info("No se encontró a nadie con esa identificación. Complete sus datos para crearla.")
        return
      }
      toast.error(
        isAxiosError(error) && typeof error.response?.data?.message === "string"
          ? error.response.data.message
          : "No se pudo agregar el integrante.",
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={alAbrirCambiar}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="size-4" />
          Agregar integrante
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar integrante</DialogTitle>
          <DialogDescription>
            Vincule a otro estudiante o egresado como integrante de este emprendimiento, exista ya
            en el sistema o no.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="numeroIdentificacion">Número de identificación</Label>
            <Input id="numeroIdentificacion" {...register("numeroIdentificacion")} />
            {errors.numeroIdentificacion && (
              <p className="text-xs text-destructive-700">{errors.numeroIdentificacion.message}</p>
            )}
          </div>

          {esPersonaNueva && (
            <>
              <p className="-mb-1 text-xs text-muted-foreground">
                No existe ningún registro con esa identificación. Complete estos datos para crear
                su cuenta y vincularla de una vez.
              </p>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="nombre">Nombre completo</Label>
                <Input id="nombre" {...register("nombre")} />
                {errors.nombre && <p className="text-xs text-destructive-700">{errors.nombre.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="correo">Correo</Label>
                <Input id="correo" type="email" {...register("correo")} />
                {errors.correo && <p className="text-xs text-destructive-700">{errors.correo.message}</p>}
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="submit" disabled={agregarIntegrante.isPending}>
              {agregarIntegrante.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {esPersonaNueva ? "Crear y agregar" : "Agregar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
