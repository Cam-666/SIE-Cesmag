import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { editarUsuarioSchema, type EditarUsuarioFormValues } from "@/domain/usuario/schemas"
import { useEditarUsuarioMutation, useRolesQuery } from "@/domain/usuario/queries"
import { NOMBRE_ROL_SIN_ROL } from "@/domain/usuario/display"
import type { Usuario } from "@/domain/usuario/types"

interface EditarUsuarioDialogProps {
  usuario: Usuario | null
  onOpenChange: (open: boolean) => void
}

/** Actualizar el rol o el estado de un usuario administrativo. */
export function EditarUsuarioDialog({ usuario, onOpenChange }: EditarUsuarioDialogProps) {
  const editarUsuario = useEditarUsuarioMutation()
  const roles = useRolesQuery()
  // "Sin rol" es el destino reservado al eliminar un rol sin reasignar — no
  // se ofrece aquí como una opción normal, solo desde esa pantalla.
  const rolesAdmin = roles.data?.filter((r) => r.ambito === "admin" && r.nombre !== NOMBRE_ROL_SIN_ROL)

  const esEmprendedor = usuario?.rol?.ambito === "emprendedor"

  const { control, handleSubmit } = useForm<EditarUsuarioFormValues>({
    resolver: zodResolver(editarUsuarioSchema),
    values: usuario ? { idRol: String(usuario.idRol), activo: usuario.activo } : undefined,
  })

  const onSubmit = async (values: EditarUsuarioFormValues) => {
    if (!usuario) return
    try {
      await editarUsuario.mutateAsync({
        idUsuario: usuario.idUsuario,
        idRol: Number(values.idRol),
        activo: values.activo,
      })
      toast.success("Usuario actualizado.")
      onOpenChange(false)
    } catch {
      toast.error("No se pudo actualizar el usuario.")
    }
  }

  return (
    <Dialog open={usuario !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {usuario && (
          <>
            <DialogHeader>
              <DialogTitle>{usuario.nombre}</DialogTitle>
              <DialogDescription>{usuario.correo}</DialogDescription>
            </DialogHeader>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="idRol">Rol asignado</Label>
                {esEmprendedor ? (
                  <p className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
                    {usuario?.rol?.nombre} — el rol de una cuenta de emprendedor no se puede cambiar aquí.
                  </p>
                ) : (
                  <Controller
                    control={control}
                    name="idRol"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="idRol" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {rolesAdmin?.map((rol) => (
                            <SelectItem key={rol.idRol} value={String(rol.idRol)}>
                              {rol.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="activo">Estado</Label>
                <Controller
                  control={control}
                  name="activo"
                  render={({ field }) => (
                    <Select
                      value={field.value ? "activo" : "inactivo"}
                      onValueChange={(v) => field.onChange(v === "activo")}
                    >
                      <SelectTrigger id="activo" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="activo">Activo</SelectItem>
                        <SelectItem value="inactivo">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={editarUsuario.isPending}>
                  {editarUsuario.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                  Guardar cambios
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
