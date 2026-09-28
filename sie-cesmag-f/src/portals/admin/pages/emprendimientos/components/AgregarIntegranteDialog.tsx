import { useState } from "react"
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

/** Registrar que otro estudiante o egresado hace parte del emprendimiento. */
export function AgregarIntegranteDialog({ idEmprendimiento }: { idEmprendimiento: number }) {
  const [open, setOpen] = useState(false)
  const agregarIntegrante = useAgregarIntegranteMutation(idEmprendimiento)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AgregarIntegranteFormValues>({ resolver: zodResolver(agregarIntegranteSchema) })

  const onSubmit = async (values: AgregarIntegranteFormValues) => {
    try {
      await agregarIntegrante.mutateAsync(values.numeroIdentificacion)
      toast.success("Integrante agregado al emprendimiento.")
      reset()
      setOpen(false)
    } catch {
      toast.error("No se pudo agregar el integrante. Verifique el número de identificación.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="size-4" />
          Agregar integrante
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Agregar integrante</DialogTitle>
          <DialogDescription>
            Vincule a otro estudiante o egresado como integrante de este emprendimiento.
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
          <DialogFooter>
            <Button type="submit" disabled={agregarIntegrante.isPending}>
              {agregarIntegrante.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Agregar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
