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
import { editarPerfilSchema, type EditarPerfilFormValues } from "@/domain/emprendedor/schemas"
import { useEditarMiPerfilMutation } from "@/domain/emprendedor/queries"
import type { Emprendedor } from "@/domain/emprendedor/types"

/** Editar los datos de contacto (no el emprendimiento). */
export function EditarPerfilDialog({ perfil }: { perfil: Emprendedor }) {
  const [open, setOpen] = useState(false)
  const editarPerfil = useEditarMiPerfilMutation()

  const { register, handleSubmit } = useForm<EditarPerfilFormValues>({
    resolver: zodResolver(editarPerfilSchema),
    defaultValues: {
      telefono: perfil.telefono ?? "",
      programaAcademico: perfil.programaAcademico ?? "",
    },
  })

  const onSubmit = async (values: EditarPerfilFormValues) => {
    try {
      await editarPerfil.mutateAsync(values)
      toast.success("Perfil actualizado.")
      setOpen(false)
    } catch {
      toast.error("No se pudo actualizar el perfil.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Pencil className="size-4" />
          Editar perfil
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Editar perfil</DialogTitle>
          <DialogDescription>
            Puede actualizar sus datos de contacto. El nombre y el correo institucional no son
            editables.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="programaAcademico">Programa académico</Label>
            <Input id="programaAcademico" {...register("programaAcademico")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input id="telefono" {...register("telefono")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={editarPerfil.isPending}>
              {editarPerfil.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Guardar cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
