import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
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
import {
  editarIntegranteSchema,
  type EditarIntegranteFormValues,
} from "@/domain/emprendimiento/schemas"
import { useEditarIntegranteMutation } from "@/domain/emprendimiento/queries"

interface EditarIntegranteDialogProps {
  idEmprendimiento: number
  idUsuario: string
  nombreActual: string
}

/** Corregir el nombre de un integrante ya vinculado al emprendimiento. */
export function EditarIntegranteDialog({
  idEmprendimiento,
  idUsuario,
  nombreActual,
}: EditarIntegranteDialogProps) {
  const [open, setOpen] = useState(false)
  const editarIntegrante = useEditarIntegranteMutation(idEmprendimiento)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditarIntegranteFormValues>({
    resolver: zodResolver(editarIntegranteSchema),
    defaultValues: { nombre: nombreActual },
  })

  const onSubmit = async (values: EditarIntegranteFormValues) => {
    try {
      await editarIntegrante.mutateAsync({ idUsuario, nombre: values.nombre })
      toast.success("Integrante actualizado.")
      setOpen(false)
    } catch {
      toast.error("No se pudo actualizar el integrante.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Editar integrante"
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Pencil className="size-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar integrante</DialogTitle>
          <DialogDescription>Corrija el nombre del integrante.</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" {...register("nombre")} />
            {errors.nombre && <p className="text-xs text-destructive-700">{errors.nombre.message}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={editarIntegrante.isPending}>
              {editarIntegrante.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
