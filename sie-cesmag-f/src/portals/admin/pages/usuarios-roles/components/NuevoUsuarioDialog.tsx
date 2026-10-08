import { useState } from "react"
import { isAxiosError } from "axios"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm, useWatch } from "react-hook-form"
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
import { useCrearIntegranteMutation, useEmprendimientosQuery } from "@/domain/emprendimiento/queries"
import { NOMBRE_ROL_SIN_ROL } from "@/domain/usuario/display"

/** Registrar un usuario administrativo, o un emprendedor vinculándolo a un emprendimiento existente. */
export function NuevoUsuarioDialog() {
  const [open, setOpen] = useState(false)
  const [esPersonaNueva, setEsPersonaNueva] = useState(false)
  const crearUsuario = useCrearUsuarioMutation()
  const crearIntegrante = useCrearIntegranteMutation()
  const roles = useRolesQuery()
  const emprendimientos = useEmprendimientosQuery({})
  // "Sin rol" es el destino reservado al eliminar un rol sin reasignar — no
  // se ofrece aquí como una opción normal, solo desde esa pantalla.
  const rolesDisponibles = roles.data?.filter((r) => r.nombre !== NOMBRE_ROL_SIN_ROL)

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<NuevoUsuarioFormValues>({
    resolver: zodResolver(nuevoUsuarioSchema),
  })

  const idRolSeleccionado = useWatch({ control, name: "idRol" })
  const rolSeleccionado = roles.data?.find((r) => String(r.idRol) === idRolSeleccionado)
  const esEmprendedor = rolSeleccionado?.ambito === "emprendedor"

  const alAbrirCambiar = (siguienteAbierto: boolean) => {
    setOpen(siguienteAbierto)
    if (!siguienteAbierto) {
      reset()
      setEsPersonaNueva(false)
    }
  }

  const onSubmit = async (values: NuevoUsuarioFormValues) => {
    if (esEmprendedor) {
      if (!values.idEmprendimiento) {
        setError("idEmprendimiento", { message: "Seleccione el emprendimiento." })
        return
      }
      if (!values.numeroIdentificacion) {
        setError("numeroIdentificacion", { message: "Ingrese el número de identificación." })
        return
      }
      if (esPersonaNueva && (!values.nombre || !values.correo)) {
        if (!values.nombre) setError("nombre", { message: "Ingrese el nombre." })
        if (!values.correo) setError("correo", { message: "Ingrese el correo." })
        return
      }
      try {
        await crearIntegrante.mutateAsync({
          idEmprendimiento: Number(values.idEmprendimiento),
          numeroIdentificacion: values.numeroIdentificacion ?? "",
          nombre: values.nombre,
          correo: values.correo,
        })
        toast.success("Emprendedor vinculado al emprendimiento.")
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
            : "No se pudo vincular al emprendedor.",
        )
      }
      return
    }

    if (!values.nombre) {
      setError("nombre", { message: "Ingrese el nombre completo." })
      return
    }
    if (!values.correo) {
      setError("correo", { message: "Ingrese el correo institucional." })
      return
    }

    try {
      await crearUsuario.mutateAsync({
        nombre: values.nombre,
        correo: values.correo,
        idRol: Number(values.idRol),
      })
      toast.success("Usuario administrativo registrado. La persona definirá su contraseña desde el enlace de acceso.")
      alAbrirCambiar(false)
    } catch {
      toast.error("No se pudo registrar el usuario.")
    }
  }

  const pendiente = crearUsuario.isPending || crearIntegrante.isPending

  return (
    <Dialog open={open} onOpenChange={alAbrirCambiar}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Nuevo usuario
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo usuario</DialogTitle>
          <DialogDescription>
            {esEmprendedor
              ? "Vincule a un emprendedor (ya exista en el sistema o no) a uno de sus emprendimientos."
              : "Se creará la cuenta y la persona definirá su propia contraseña desde el enlace de acceso."}
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="idRol">Rol</Label>
            <Controller
              control={control}
              name="idRol"
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
                  onValueChange={(v) => {
                    field.onChange(v)
                    setEsPersonaNueva(false)
                  }}
                >
                  <SelectTrigger id="idRol" className="w-full">
                    <SelectValue placeholder="Seleccione un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {rolesDisponibles?.map((rol) => (
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

          {esEmprendedor && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="idEmprendimiento">Emprendimiento</Label>
                <Controller
                  control={control}
                  name="idEmprendimiento"
                  render={({ field }) => (
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <SelectTrigger id="idEmprendimiento" className="w-full">
                        <SelectValue placeholder="Seleccione el emprendimiento" />
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
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="numeroIdentificacion">Número de identificación</Label>
                <Input id="numeroIdentificacion" {...register("numeroIdentificacion")} />
                {errors.numeroIdentificacion && (
                  <p className="text-xs text-destructive-700">{errors.numeroIdentificacion.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Si ya llenó la encuesta de caracterización o tiene cuenta, se vincula directo.
                </p>
              </div>
            </>
          )}

          {(!esEmprendedor || esPersonaNueva) && (
            <>
              {esEmprendedor && (
                <p className="-mb-1 text-xs text-muted-foreground">
                  No existe ningún registro con esa identificación. Complete estos datos para crear
                  su cuenta y vincularla de una vez.
                </p>
              )}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="nombre">Nombre completo</Label>
                <Input id="nombre" {...register("nombre")} />
                {errors.nombre && <p className="text-xs text-destructive-700">{errors.nombre.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="correo">Correo{esEmprendedor ? "" : " institucional"}</Label>
                <Input
                  id="correo"
                  type="email"
                  placeholder={esEmprendedor ? undefined : "nombre@unicesmag.edu.co"}
                  {...register("correo")}
                />
                {errors.correo && <p className="text-xs text-destructive-700">{errors.correo.message}</p>}
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pendiente}>
              {pendiente ? <Loader2 className="size-4 animate-spin" /> : null}
              {esEmprendedor ? (esPersonaNueva ? "Crear y vincular" : "Vincular") : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
