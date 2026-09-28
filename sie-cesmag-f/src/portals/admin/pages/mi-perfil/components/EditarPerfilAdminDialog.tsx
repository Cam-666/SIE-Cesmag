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
  editarMiPerfilAdminSchema,
  type EditarMiPerfilAdminFormValues,
} from "@/domain/usuario/schemas"
import { useEditarMiPerfilAdminMutation } from "@/domain/usuario/queries"
import type { Usuario } from "@/domain/usuario/types"
import { useAuthStore } from "@/stores/auth-store"

/** Editar el teléfono y el correo de contacto propio (nombre y rol no son editables aquí). */
export function EditarPerfilAdminDialog({ perfil }: { perfil: Usuario }) {
  const [open, setOpen] = useState(false)
  const editarPerfil = useEditarMiPerfilAdminMutation()
  const actualizarSesion = useAuthStore((state) => state.actualizarSesion)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditarMiPerfilAdminFormValues>({
    resolver: zodResolver(editarMiPerfilAdminSchema),
    defaultValues: { telefono: perfil.telefono ?? "", correo: perfil.correo },
  })

  const onSubmit = async (values: EditarMiPerfilAdminFormValues) => {
    try {
      await editarPerfil.mutateAsync(values)
      actualizarSesion({ correo: values.correo })
      toast.success("Perfil actualizado.")
      setOpen(false)
    } catch {
      toast.error("No se pudo actualizar el perfil. Verifique que el correo no esté ya registrado.")
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
            Puede actualizar su teléfono y su correo de contacto. El nombre y el rol no son
            editables desde aquí.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="correo">Correo</Label>
            <Input id="correo" type="email" {...register("correo")} />
            {errors.correo && <p className="text-xs text-destructive-700">{errors.correo.message}</p>}
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
