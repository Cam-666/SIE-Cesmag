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
import { nuevoUsuarioSchema, type NuevoUsuarioFormValues } from "@/domain/usuario/schemas"
import { useCrearUsuarioMutation, useRolesQuery } from "@/domain/usuario/queries"
import { NOMBRE_ROL_SIN_ROL } from "@/domain/usuario/display"

/** Registrar un nuevo usuario administrativo. */
export function NuevoUsuarioDialog() {
  const [open, setOpen] = useState(false)
  const crearUsuario = useCrearUsuarioMutation()
  const roles = useRolesQuery()
  // "Sin rol" es el destino reservado al eliminar un rol sin reasignar — no
  // se ofrece aquí como una opción normal, solo desde esa pantalla.
  const rolesAdmin = roles.data?.filter((r) => r.ambito === "admin" && r.nombre !== NOMBRE_ROL_SIN_ROL)

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NuevoUsuarioFormValues>({ resolver: zodResolver(nuevoUsuarioSchema) })

  const onSubmit = async (values: NuevoUsuarioFormValues) => {
    try {
      await crearUsuario.mutateAsync({
        nombre: values.nombre,
        correo: values.correo,
        idRol: Number(values.idRol),
      })
      toast.success("Usuario administrativo registrado. La persona definirá su contraseña desde el enlace de acceso.")
      reset()
      setOpen(false)
    } catch {
      toast.error("No se pudo registrar el usuario.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Nuevo usuario
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Nuevo usuario administrativo</DialogTitle>
          <DialogDescription>
            Se creará la cuenta y la persona definirá su propia contraseña desde el enlace de acceso.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nombre">Nombre completo</Label>
            <Input id="nombre" {...register("nombre")} />
            {errors.nombre && <p className="text-xs text-destructive-700">{errors.nombre.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="correo">Correo institucional</Label>
            <Input id="correo" type="email" placeholder="nombre@unicesmag.edu.co" {...register("correo")} />
            {errors.correo && <p className="text-xs text-destructive-700">{errors.correo.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="idRol">Rol</Label>
            <Controller
              control={control}
              name="idRol"
              render={({ field }) => (
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <SelectTrigger id="idRol" className="w-full">
                    <SelectValue placeholder="Seleccione un rol" />
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
            {errors.idRol && <p className="text-xs text-destructive-700">{errors.idRol.message}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={crearUsuario.isPending}>
              {crearUsuario.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Registrar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
